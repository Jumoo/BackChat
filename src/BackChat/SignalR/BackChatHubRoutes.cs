using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Routing;
using Umbraco.Extensions;

namespace BackChat.SignalR;

internal class BackChatHubRoutes : IAreaRoutes
{
    private readonly IRuntimeState _runtimeState;
    private readonly string _backOfficePath;

    public BackChatHubRoutes(IHostingEnvironment hostingEnvironment, IRuntimeState runtimeState)
    {
        _runtimeState = runtimeState;
        _backOfficePath = hostingEnvironment.GetBackOfficePath().TrimEnd('/');
    }

    public void CreateRoutes(IEndpointRouteBuilder endpoints)
        => _ = CreateEndpointRoutes(endpoints);

    public IEndpointConventionBuilder? CreateEndpointRoutes(IEndpointRouteBuilder endpoints)
    {
        if (_runtimeState.Level >= RuntimeLevel.Install)
        {
            return endpoints.MapHub<BackChatHub>($"{_backOfficePath}/chathub");
        }

        return null;
    }
}
