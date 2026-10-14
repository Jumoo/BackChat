using BackChat.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.ViewModels.Pagination;
using Umbraco.Cms.Core.Security;

namespace BackChat.Api;

[ApiExplorerSettings(GroupName = "Mentions")]
public class MentionsController(
    UnreadMentionService unreadMentionService,
    IBackOfficeSecurityAccessor backOfficeSecurityAccessor) : BackChatApiControllerBase(backOfficeSecurityAccessor)
{
    /// <summary>
    /// Mentions of the current user they haven't read yet, newest first.
    /// </summary>
    [HttpGet("mentions/unread")]
    [ProducesResponseType<PagedViewModel<UnreadMention>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadMentions(int skip = 0, int take = 20)
    {
        var (items, total) = await unreadMentionService.GetAsync(CurrentUser, skip, take);
        return Ok(new PagedViewModel<UnreadMention> { Total = total, Items = items });
    }
}
