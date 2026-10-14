using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;

namespace BackChat.SignalR;

public static class BackChatHubExtensions
{
    public static IUmbracoBuilder AddBackChatHub(this IUmbracoBuilder builder)
    {
        builder.Services.AddSignalR();
        builder.Services.AddSingleton<BackChatHubRoutes>();
        builder.Services.ConfigureOptions<ConfigureHubOptions>();

        return builder;
    }
}
