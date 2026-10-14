using BackChat.Manifest;
using BackChat.Persistence;
using BackChat.Services;
using BackChat.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
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

        builder.AddBackChatHub();

        // Adds our bundle to the backoffice alongside the manifests Umbraco reads itself
        builder.Services.AddSingleton<IPackageManifestReader, BackChatPackageManifestReader>();
    }
}
