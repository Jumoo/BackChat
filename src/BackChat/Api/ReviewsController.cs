using BackChat.Reviews;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.ViewModels.Pagination;
using Umbraco.Cms.Core.Security;

namespace BackChat.Api;

public class SetReviewDateRequestModel
{
    /// <summary>The date to review by, or null to go back to the rule's date.</summary>
    public DateTime? Date { get; init; }
}

public class MarkReviewedRequestModel
{
    public string? Note { get; init; }
}

public class SaveReviewRuleRequestModel
{
    public Guid ContentTypeKey { get; init; }

    public int IntervalMonths { get; init; }

    public bool FromPublish { get; init; }
}

[ApiExplorerSettings(GroupName = "Reviews")]
public class ReviewsController(
    ReviewService reviewService,
    IBackOfficeSecurityAccessor backOfficeSecurityAccessor) : BackChatApiControllerBase(backOfficeSecurityAccessor)
{
    [HttpGet("document/{documentKey:guid}/review")]
    [ProducesResponseType<ReviewState>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReview(Guid documentKey)
    {
        var (status, state) = await reviewService.GetStateAsync(CurrentUser, documentKey);
        return status == ReviewOperationStatus.Success ? Ok(state) : StatusResult(status);
    }

    [HttpPut("document/{documentKey:guid}/review/date")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetReviewDate(Guid documentKey, SetReviewDateRequestModel model)
        => StatusResult(await reviewService.SetDateAsync(CurrentUser, documentKey, model.Date));

    [HttpPost("document/{documentKey:guid}/review/reviewed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkReviewed(Guid documentKey, MarkReviewedRequestModel model)
        => StatusResult(await reviewService.MarkReviewedAsync(CurrentUser, documentKey, model.Note));

    /// <summary>
    /// Documents due for review: the ones the current user is responsible for, or all of them
    /// with the permission to see everything.
    /// </summary>
    [HttpGet("reviews/due")]
    [ProducesResponseType<PagedViewModel<DueReview>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDueReviews(bool everyone = false, int skip = 0, int take = 20)
    {
        var (status, items, total) = await reviewService.GetDueAsync(CurrentUser, everyone, skip, take);
        return status == ReviewOperationStatus.Success
            ? Ok(new PagedViewModel<DueReview> { Total = total, Items = items })
            : StatusResult(status);
    }

    [HttpGet("review-rules")]
    [ProducesResponseType<IEnumerable<ReviewRule>>(StatusCodes.Status200OK)]
    public IActionResult GetReviewRules() => Ok(reviewService.GetRules());

    [HttpPost("review-rules")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult CreateReviewRule(SaveReviewRuleRequestModel model)
        => StatusResult(reviewService.SaveRule(CurrentUser, null, model.ContentTypeKey, model.IntervalMonths, model.FromPublish));

    [HttpPut("review-rules/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult UpdateReviewRule(Guid id, SaveReviewRuleRequestModel model)
        => StatusResult(reviewService.SaveRule(CurrentUser, id, model.ContentTypeKey, model.IntervalMonths, model.FromPublish));

    [HttpDelete("review-rules/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DeleteReviewRule(Guid id) => StatusResult(reviewService.DeleteRule(CurrentUser, id));

    private IActionResult StatusResult(ReviewOperationStatus status) => status switch
    {
        ReviewOperationStatus.Success => Ok(),
        ReviewOperationStatus.NotFound => NotFound(),
        ReviewOperationStatus.NoAccess => Forbid(),
        ReviewOperationStatus.Invalid => BadRequest(),
        _ => StatusCode(StatusCodes.Status500InternalServerError),
    };
}
