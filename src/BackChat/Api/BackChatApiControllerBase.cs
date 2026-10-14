using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Filters;

namespace BackChat.Api;

/// <summary>
/// BackChat's Management API: <c>/umbraco/management/api/v1/backchat/...</c>, with its own
/// swagger document that the client is generated from.
/// </summary>
[ApiController]
[VersionedApiBackOfficeRoute(BackChatApi.RoutePrefix)]
[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
[MapToApi(BackChatApi.ApiName)]
[DisableBrowserCache]
[JsonOptionsName(Umbraco.Cms.Core.Constants.JsonOptionsNames.BackOffice)]
[ApiVersion("1.0")]
public abstract class BackChatApiControllerBase(IBackOfficeSecurityAccessor backOfficeSecurityAccessor) : ControllerBase
{
    protected IUser CurrentUser
        => backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser
            ?? throw new InvalidOperationException("No backoffice user.");
}

public static class BackChatApi
{
    public const string ApiName = "backchat";
    public const string RoutePrefix = "backchat";
}
