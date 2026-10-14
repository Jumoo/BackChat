using BackChat.Activity;
using BackChat.Persistence;
using BackChat.Services;
using BackChat.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.BackgroundJobs;

namespace BackChat.Reviews;

/// <summary>
/// Reminds people when a document falls due for review. Distributed, so on a load balanced
/// site only one server sends reminders, and each due date is reminded once.
/// </summary>
/// <remarks>
/// The reminder is a line in the document's chat that counts as a mention for each person
/// responsible, so it shows on their badge, plus a toast if they're signed in.
/// </remarks>
public class ReviewReminderJob(
    IReviewStore reviewStore,
    ReviewService reviewService,
    IContentService contentService,
    ActivityService activityService,
    IMentionStore mentionStore,
    BackChatNotifier notifier,
    IHubContext<BackChatHub> hubContext,
    IOptions<BackChatReviewOptions> options,
    ILogger<ReviewReminderJob> logger) : IDistributedBackgroundJob
{
    public string Name => "BackChat.ReviewReminders";

    public TimeSpan Period => options.Value.ReminderPeriod;

    public async Task ExecuteAsync()
    {
        foreach (ReviewDto review in reviewStore.GetDueNotReminded(DateTime.UtcNow))
        {
            try
            {
                await RemindAsync(review);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "BackChat: couldn't send the review reminder for {DocumentKey}", review.DocumentKey);
            }
        }
    }

    private async Task RemindAsync(ReviewDto review)
    {
        IContent? content = contentService.GetById(review.DocumentKey);

        // Nothing to remind about for a deleted or binned document; mark it done so it isn't retried
        if (content is not null && content.Trashed is false)
        {
            IReadOnlyList<IUser> responsible = await reviewService.GetResponsibleAsync(content);
            ChatMessage? line = await activityService.PostAsync(content.Key, ContentActivity.ReviewDue, null);

            foreach (IUser user in responsible)
            {
                if (line is not null)
                {
                    mentionStore.Add(line, [user.Key]);
                    await notifier.SendUnreadCountAsync(user.Key, line.Channel);
                }

                await hubContext.Clients.Group(BackChatNotifier.UserGroupName(user.Key))
                    .SendAsync("reviewDue", new { DocumentKey = content.Key, DocumentName = content.Name });
            }
        }

        review.RemindedFor = review.NextReview;
        reviewStore.Save(review);
    }
}
