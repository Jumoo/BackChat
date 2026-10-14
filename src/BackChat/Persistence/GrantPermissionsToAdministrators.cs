using BackChat.Security;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

/// <summary>
/// Gives the Administrators group every BackChat permission on install, so a site can use
/// BackChat without anyone opening the user group editor. Other groups start with none, so
/// nobody else can send a screen-blocking message until an admin allows it.
/// </summary>
public class GrantPermissionsToAdministrators : AsyncMigrationBase
{
    private readonly IUserGroupService _userGroupService;

    public GrantPermissionsToAdministrators(IMigrationContext context, IUserGroupService userGroupService)
        : base(context)
    {
        _userGroupService = userGroupService;
    }

    protected override async Task MigrateAsync()
    {
        IUserGroup? admins = await _userGroupService.GetAsync(Umbraco.Cms.Core.Constants.Security.AdminGroupKey);
        if (admins is null)
        {
            Logger.LogWarning("BackChat: no Administrators group, so no BackChat permissions were granted");
            return;
        }

        var missing = BackChatPermissions.All.Where(p => admins.Permissions.Contains(p) is false).ToList();
        if (missing.Count == 0)
        {
            return;
        }

        admins.Permissions = admins.Permissions.Union(missing).ToHashSet();
        await _userGroupService.UpdateAsync(admins, Umbraco.Cms.Core.Constants.Security.SuperUserKey);
    }
}
