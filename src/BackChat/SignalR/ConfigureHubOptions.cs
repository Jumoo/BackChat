using Microsoft.Extensions.Options;
using Umbraco.Cms.Web.Common.ApplicationBuilder;

namespace BackChat.SignalR;

internal class ConfigureHubOptions : IConfigureOptions<UmbracoPipelineOptions>
{
    public void Configure(UmbracoPipelineOptions options)
    {
        options.AddFilter(new HubBackChatFilter());
    }
}
