using BackChat.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.ViewModels.Pagination;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace BackChat.Api;

[ApiExplorerSettings(GroupName = "Tasks")]
public class TasksController(
    TaskService taskService,
    IEntityService entityService,
    IBackOfficeSecurityAccessor backOfficeSecurityAccessor) : BackChatApiControllerBase(backOfficeSecurityAccessor)
{
    [HttpGet("document/{documentKey:guid}/tasks")]
    [ProducesResponseType<IEnumerable<TaskResponseModel>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetTasks(Guid documentKey)
    {
        var (status, tasks) = await taskService.GetForDocumentAsync(CurrentUser, documentKey);
        return status == TaskOperationStatus.Success
            ? Ok(tasks.Select(t => TaskResponseModel.From(t)))
            : StatusResult(status);
    }

    [HttpPost("document/{documentKey:guid}/tasks")]
    [ProducesResponseType<TaskResponseModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateTask(Guid documentKey, CreateTaskRequestModel model)
    {
        var (status, task) = await taskService.CreateAsync(
            CurrentUser, documentKey, new TaskChange(model.Title, model.AssigneeKey, model.DueDate, false));
        return status == TaskOperationStatus.Success ? Ok(TaskResponseModel.From(task!)) : StatusResult(status);
    }

    [HttpPut("document/{documentKey:guid}/tasks/sort")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SortTasks(Guid documentKey, SortTasksRequestModel model)
    {
        TaskOperationStatus status = await taskService.SortAsync(CurrentUser, documentKey, model.Keys);
        return status == TaskOperationStatus.Success ? Ok() : StatusResult(status);
    }

    [HttpPut("task/{key:guid}")]
    [ProducesResponseType<TaskResponseModel>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTask(Guid key, UpdateTaskRequestModel model)
    {
        var (status, task) = await taskService.UpdateAsync(
            CurrentUser, key, new TaskChange(model.Title, model.AssigneeKey, model.DueDate, model.IsComplete));
        return status == TaskOperationStatus.Success ? Ok(TaskResponseModel.From(task!)) : StatusResult(status);
    }

    [HttpDelete("task/{key:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTask(Guid key)
    {
        TaskOperationStatus status = await taskService.DeleteAsync(CurrentUser, key);
        return status == TaskOperationStatus.Success ? Ok() : StatusResult(status);
    }

    /// <summary>
    /// Open tasks, soonest due first: the current user's, or everyone's with the permission to see everything.
    /// </summary>
    [HttpGet("tasks/open")]
    [ProducesResponseType<PagedViewModel<TaskResponseModel>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetOpenTasks(bool everyone = false, int skip = 0, int take = 20)
    {
        var (status, items, total) = await taskService.GetOpenAsync(CurrentUser, everyone, skip, take);
        if (status != TaskOperationStatus.Success)
        {
            return StatusResult(status);
        }

        var names = entityService
            .GetAll(UmbracoObjectTypes.Document, items.Select(t => t.DocumentKey).Distinct().ToArray())
            .ToDictionary(e => e.Key, e => e.Name);

        return Ok(new PagedViewModel<TaskResponseModel>
        {
            Total = total,
            Items = items.Select(t => TaskResponseModel.From(t, names.GetValueOrDefault(t.DocumentKey))),
        });
    }

    private IActionResult StatusResult(TaskOperationStatus status) => status switch
    {
        TaskOperationStatus.NotFound => NotFound(),
        TaskOperationStatus.NoAccess => Forbid(),
        TaskOperationStatus.Invalid => BadRequest(),
        _ => StatusCode(StatusCodes.Status500InternalServerError),
    };
}
