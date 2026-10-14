using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.AuthorizationStatus;

namespace BackChat.Services;

/// <summary>
/// Decides who can read and post in a channel. Every channel kind's access rule lives here,
/// so the hub and anything that notifies users about a channel check it the same way.
/// </summary>
public class ChannelAccessService(IContentPermissionService contentPermissionService)
{
    /// <summary>
    /// Returns the channel in its normalised form when the user can use it, or null when the
    /// channel is invalid or the user has no access.
    /// </summary>
    /// <remarks>
    /// A channel is either the global channel or a document key. Document channels need browse
    /// access to the document, so a chat is only visible to users who can see it.
    /// </remarks>
    public async Task<string?> AuthorizeAsync(IUser user, string channel)
    {
        if (channel == Constants.GlobalChannel)
        {
            return channel;
        }

        if (Guid.TryParse(channel, out Guid documentKey) is false)
        {
            return null;
        }

        ContentAuthorizationStatus status = await contentPermissionService.AuthorizeAccessAsync(
            user, documentKey, ActionBrowse.ActionLetter);

        return status == ContentAuthorizationStatus.Success ? documentKey.ToString() : null;
    }
}
