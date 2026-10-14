using BackChat.Activity;
using BackChat.Api;
using BackChat.Manifest;
using BackChat.Persistence;
using BackChat.Services;
using BackChat.SignalR;
using BackChat.Reviews;
using BackChat.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Infrastructure.BackgroundJobs;
using Umbraco.Cms.Infrastructure.Manifest;

namespace BackChat.Composers;

public class BackChatComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<IChatMessageStore, DatabaseChatMessageStore>();
        builder.Services.AddSingleton<IReadStateStore, DatabaseReadStateStore>();
        builder.Services.AddSingleton<IMentionStore, DatabaseMentionStore>();
        builder.Services.AddSingleton<ChannelAccessService>();
        builder.Services.AddSingleton<MentionService>();
        builder.Services.AddSingleton<UnreadService>();
        builder.Services.AddSingleton<ConversationService>();
        builder.Services.AddSingleton<IConfirmationStore, DatabaseConfirmationStore>();
        builder.Services.AddSingleton<ConfirmationService>();

        builder.Services.Configure<BackChatActivityOptions>(builder.Config.GetSection(BackChatActivityOptions.Section));
        builder.Services.AddSingleton<ActivityService>();
        builder
            .AddNotificationAsyncHandler<ContentSavedNotification, ContentActivityNotificationHandler>()
            .AddNotificationAsyncHandler<ContentPublishedNotification, ContentActivityNotificationHandler>()
            .AddNotificationAsyncHandler<ContentUnpublishedNotification, ContentActivityNotificationHandler>()
            .AddNotificationAsyncHandler<ContentMovedNotification, ContentActivityNotificationHandler>()
            .AddNotificationAsyncHandler<ContentMovedToRecycleBinNotification, ContentActivityNotificationHandler>()
            .AddNotificationAsyncHandler<ContentCopiedNotification, ContentActivityNotificationHandler>()
            .AddNotificationAsyncHandler<ContentRolledBackNotification, ContentActivityNotificationHandler>();

        builder.Services.AddSingleton<ITaskStore, DatabaseTaskStore>();
        builder.Services.AddSingleton<TaskService>();
        builder.AddNotificationHandler<ContentDeletedNotification, DeleteTasksWithDocumentHandler>();

        builder.Services.Configure<BackChatReviewOptions>(builder.Config.GetSection(BackChatReviewOptions.Section));
        builder.Services.AddSingleton<IReviewStore, DatabaseReviewStore>();
        builder.Services.AddSingleton<ReviewService>();
        builder.Services.AddSingleton<IDistributedBackgroundJob, ReviewReminderJob>();
        builder
            .AddNotificationHandler<ContentPublishedNotification, ReviewNotificationHandler>()
            .AddNotificationHandler<ContentDeletedNotification, ReviewNotificationHandler>();

        builder.AddBackChatHub();
        builder.AddBackChatApi();

        // Adds our bundle to the backoffice alongside the manifests Umbraco reads itself
        builder.Services.AddSingleton<IPackageManifestReader, BackChatPackageManifestReader>();
    }
}
