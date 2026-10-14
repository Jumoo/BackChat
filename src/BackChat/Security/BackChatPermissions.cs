using Umbraco.Cms.Core.Models.Membership;

namespace BackChat.Security;

/// <summary>
/// BackChat's own user group permissions. They're stored with Umbraco's in the group's
/// permission set, and set in the user group editor under the BackChat heading. Plain chat,
/// mentioning a person and tasks on documents you can access don't need one.
/// </summary>
/// <remarks>The client registers the same strings in <c>Client/src/permissions</c>.</remarks>
public static class BackChatPermissions
{
    /// <summary>Send important messages, or ask for read confirmation.</summary>
    public const string Announce = "BackChat.Announce";

    /// <summary>Start a conversation with a whole user group.</summary>
    public const string MessageGroups = "BackChat.MessageGroups";

    /// <summary>Mention a whole user group.</summary>
    public const string MentionGroups = "BackChat.MentionGroups";

    /// <summary>Pin a note on a document.</summary>
    public const string PinNotes = "BackChat.PinNotes";

    /// <summary>Manage the rules that set review dates.</summary>
    public const string ManageReviews = "BackChat.ManageReviews";

    /// <summary>See everything on the comms dashboard, not only your own items.</summary>
    public const string ViewAll = "BackChat.ViewAll";

    public static readonly IReadOnlyList<string> All =
        [Announce, MessageGroups, MentionGroups, PinNotes, ManageReviews, ViewAll];

    public static bool Has(this IUser user, string permission)
        => user.Groups.Any(group => group.Permissions.Contains(permission));

    public static IReadOnlyList<string> GetBackChatPermissions(this IUser user)
        => All.Where(user.Has).ToList();
}
