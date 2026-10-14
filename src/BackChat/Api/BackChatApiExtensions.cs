using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Core.DependencyInjection;

namespace BackChat.Api;

public static class BackChatApiExtensions
{
    public static IUmbracoBuilder AddBackChatApi(this IUmbracoBuilder builder)
    {
        builder.Services.ConfigureOptions<ConfigureBackChatSwaggerGenOptions>();
        builder.Services.AddSingleton<IOperationIdHandler, BackChatOperationIdHandler>();
        return builder;
    }
}

// Our own swagger document, at /umbraco/swagger/backchat/swagger.json
internal class ConfigureBackChatSwaggerGenOptions : IConfigureOptions<SwaggerGenOptions>
{
    public void Configure(SwaggerGenOptions options)
    {
        options.SwaggerDoc(
            BackChatApi.ApiName,
            new OpenApiInfo
            {
                Title = "BackChat API",
                Version = "Latest",
                Description = "BackChat's backoffice API",
            });

        options.OperationFilter<BackChatOperationSecurityFilter>();
    }
}

internal class BackChatOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
{
    protected override string ApiName => BackChatApi.ApiName;
}

// Operation ids are the action names, so the generated client reads TasksService.getTasks(...)
internal class BackChatOperationIdHandler : IOperationIdHandler
{
    public bool CanHandle(ApiDescription apiDescription)
        => apiDescription.ActionDescriptor is ControllerActionDescriptor descriptor
           && descriptor.ControllerTypeInfo.Namespace == typeof(BackChatApi).Namespace;

    public string Handle(ApiDescription apiDescription)
        => $"{apiDescription.ActionDescriptor.RouteValues["action"]}";
}
