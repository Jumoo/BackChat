using BackChat.Activity;
using BackChat.Security;
using BackChat.Services;
using BackChat.SignalR;
using Microsoft.AspNetCore.SignalR;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.AuthorizationStatus;

namespace BackChat.Tasks;

public enum TaskOperationStatus
{
    Success,
    NotFound,
    NoAccess,
    Invalid,
}

/// <summary>What a task should look like after a create or an edit.</summary>
public record TaskChange(string Title, Guid? AssigneeKey, DateTime? DueDate, bool IsComplete);

/// <summary>
/// Tasks on content. Access follows the document: browse permission to see its tasks, update
/// permission to change them. Assigning or completing a task posts a line in the document's
/// chat, and every change tells open tabs to refresh.
/// </summary>
public class TaskService(
    ITaskStore taskStore,
    IContentPermissionService contentPermissionService,
    ActivityService activityService,
    IMentionStore mentionStore,
    BackChatNotifier notifier,
    IHubContext<BackChatHub> hubContext,
    IUserService userService)
{
    public const int MaxTitleLength = 255;

    public async Task<(TaskOperationStatus Status, IReadOnlyList<ContentTask> Tasks)> GetForDocumentAsync(
        IUser user, Guid documentKey)
    {
        if (await CanAsync(user, documentKey, ActionBrowse.ActionLetter) is false)
        {
            return (TaskOperationStatus.NoAccess, []);
        }

        return (TaskOperationStatus.Success, taskStore.GetForDocument(documentKey));
    }

    public async Task<(TaskOperationStatus Status, ContentTask? Task)> CreateAsync(
        IUser user, Guid documentKey, TaskChange change)
    {
        if (IsValid(change) is false)
        {
            return (TaskOperationStatus.Invalid, null);
        }

        if (await CanAsync(user, documentKey, ActionUpdate.ActionLetter) is false)
        {
            return (TaskOperationStatus.NoAccess, null);
        }

        var task = new ContentTask
        {
            DocumentKey = documentKey,
            Title = change.Title.Trim(),
            DueDate = change.DueDate,
            CreatedBy = user.Key,
            SortOrder = taskStore.GetForDocument(documentKey).Select(t => t.SortOrder).DefaultIfEmpty(-1).Max() + 1,
        };

        await ApplyAsync(user, task, change);
        return (TaskOperationStatus.Success, task);
    }

    public async Task<(TaskOperationStatus Status, ContentTask? Task)> UpdateAsync(
        IUser user, Guid key, TaskChange change)
    {
        if (IsValid(change) is false)
        {
            return (TaskOperationStatus.Invalid, null);
        }

        ContentTask? task = taskStore.Get(key);
        if (task is null)
        {
            return (TaskOperationStatus.NotFound, null);
        }

        if (await CanAsync(user, task.DocumentKey, ActionUpdate.ActionLetter) is false)
        {
            return (TaskOperationStatus.NoAccess, null);
        }

        task.Title = change.Title.Trim();
        task.DueDate = change.DueDate;

        await ApplyAsync(user, task, change);
        return (TaskOperationStatus.Success, task);
    }

    public async Task<TaskOperationStatus> DeleteAsync(IUser user, Guid key)
    {
        ContentTask? task = taskStore.Get(key);
        if (task is null)
        {
            return TaskOperationStatus.NotFound;
        }

        if (await CanAsync(user, task.DocumentKey, ActionUpdate.ActionLetter) is false)
        {
            return TaskOperationStatus.NoAccess;
        }

        taskStore.Delete(key);
        await SendChangedAsync(task.DocumentKey);
        return TaskOperationStatus.Success;
    }

    /// <summary>
    /// Puts the document's tasks in the given order. Tasks not in the list keep their place after them.
    /// </summary>
    public async Task<TaskOperationStatus> SortAsync(IUser user, Guid documentKey, IReadOnlyList<Guid> keys)
    {
        if (await CanAsync(user, documentKey, ActionUpdate.ActionLetter) is false)
        {
            return TaskOperationStatus.NoAccess;
        }

        IReadOnlyList<ContentTask> tasks = taskStore.GetForDocument(documentKey);
        var ordered = tasks
            .OrderBy(t => keys.Contains(t.Key) ? keys.ToList().IndexOf(t.Key) : keys.Count + t.SortOrder)
            .ToList();

        for (int i = 0; i < ordered.Count; i++)
        {
            if (ordered[i].SortOrder != i)
            {
                ordered[i].SortOrder = i;
                taskStore.Save(ordered[i]);
            }
        }

        await SendChangedAsync(documentKey);
        return TaskOperationStatus.Success;
    }

    /// <summary>
    /// Open tasks across the site that the user can see, soonest due first. Without
    /// <paramref name="everyone"/>, only tasks assigned to the user; with it, everyone's, which
    /// needs the permission to see everything on the dashboard.
    /// </summary>
    public async Task<(TaskOperationStatus Status, IReadOnlyList<ContentTask> Items, long Total)> GetOpenAsync(
        IUser user, bool everyone, int skip, int take)
    {
        if (everyone && user.Has(BackChatPermissions.ViewAll) is false)
        {
            return (TaskOperationStatus.NoAccess, [], 0);
        }

        (IReadOnlyList<ContentTask> items, long total) = taskStore.GetOpen(everyone ? null : user.Key, skip, take);

        var visible = new List<ContentTask>();
        foreach (ContentTask task in items)
        {
            if (await CanAsync(user, task.DocumentKey, ActionBrowse.ActionLetter))
            {
                visible.Add(task);
            }
        }

        // The total counts tasks on documents the user can't browse too; close enough for paging
        return (TaskOperationStatus.Success, visible, total);
    }

    private async Task ApplyAsync(IUser user, ContentTask task, TaskChange change)
    {
        Guid? previousAssignee = task.AssigneeKey;
        bool wasComplete = task.IsComplete;

        task.AssigneeKey = change.AssigneeKey;
        if (change.IsComplete && wasComplete is false)
        {
            task.CompletedBy = user.Key;
            task.CompletedDate = DateTime.UtcNow;
        }
        else if (change.IsComplete is false)
        {
            task.CompletedBy = null;
            task.CompletedDate = null;
        }

        taskStore.Save(task);

        if (change.AssigneeKey is { } assigneeKey && assigneeKey != previousAssignee)
        {
            await NotifyAssigneeAsync(user, task, assigneeKey);
        }

        if (task.IsComplete && wasComplete is false)
        {
            await activityService.PostAsync(task.DocumentKey, ContentActivity.TaskCompleted, user, task.Title);
        }

        await SendChangedAsync(task.DocumentKey);
    }

    // The assignee gets a line in the chat that counts as a mention, so it shows on their
    // badge, and a toast if they're signed in. Assigning yourself needs no notice.
    private async Task NotifyAssigneeAsync(IUser user, ContentTask task, Guid assigneeKey)
    {
        IUser? assignee = await userService.GetAsync(assigneeKey);
        string? assigneeName = assignee?.Name ?? assignee?.Username;

        ChatMessage? line = await activityService.PostAsync(
            task.DocumentKey, ContentActivity.TaskAssigned, user, task.Title, assigneeName);

        if (assigneeKey == user.Key || assignee is null)
        {
            return;
        }

        if (line is not null)
        {
            mentionStore.Add(line, [assigneeKey]);
            await notifier.SendUnreadCountAsync(assigneeKey, line.Channel);
        }

        await hubContext.Clients.Group(BackChatNotifier.UserGroupName(assigneeKey))
            .SendAsync("taskAssigned", new { task.Key, task.DocumentKey, task.Title, AssignedBy = user.Name ?? user.Username });
    }

    private Task SendChangedAsync(Guid documentKey)
        => hubContext.Clients.Group(BackChatHub.GroupName(documentKey.ToString())).SendAsync("tasksChanged", documentKey);

    private async Task<bool> CanAsync(IUser user, Guid documentKey, string permission)
        => await contentPermissionService.AuthorizeAccessAsync(user, documentKey, permission)
            == ContentAuthorizationStatus.Success;

    private static bool IsValid(TaskChange change)
        => string.IsNullOrWhiteSpace(change.Title) is false && change.Title.Trim().Length <= MaxTitleLength;
}
