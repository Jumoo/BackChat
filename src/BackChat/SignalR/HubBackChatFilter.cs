using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Web.Common.ApplicationBuilder;

namespace BackChat.SignalR;

internal class HubBackChatFilter : UmbracoPipelineFilter
{
    public HubBackChatFilter() : base(nameof(BackChatHub))
    {
        Endpoints = app =>
        {
            app.UseEndpoints(endpoints =>
            {
                app.ApplicationServices
                    .GetRequiredService<BackChatHubRoutes>()
                    .CreateRoutes(endpoints);
            });
        };
    }
}
