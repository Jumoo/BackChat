using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Services;

namespace BackChat.SignalR;

// Maps the hub next to Umbraco's own backoffice hubs. SignalRRoutesBase applies
// Umbraco's SignalR settings, so ClientShouldSkipNegotiation covers our hub too.
internal class BackChatHubRoutes : SignalRRoutesBase
{
    public const string HubPath = "/backchathub";

    public BackChatHubRoutes(IRuntimeState runtimeState, IOptions<SignalRSettings> signalRSettings)
        : base(runtimeState, signalRSettings)
    {
    }

    public void CreateRoutes(IEndpointRouteBuilder endpoints)
    {
        if (RuntimeState.Level is RuntimeLevel.Install or RuntimeLevel.Upgrade or RuntimeLevel.Upgrading or RuntimeLevel.Run)
        {
            endpoints.MapHub<BackChatHub>(
                Umbraco.Cms.Core.Constants.System.UmbracoPathSegment + HubPath,
                ConfigureHubEndpoint);
        }
    }
}
