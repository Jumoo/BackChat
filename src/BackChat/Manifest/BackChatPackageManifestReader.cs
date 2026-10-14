using Umbraco.Cms.Core.Manifest;
using Umbraco.Cms.Infrastructure.Manifest;

namespace BackChat.Manifest;

/// <summary>
/// Registers the backoffice bundle from code, so the package doesn't ship an umbraco-package.json.
/// </summary>
public class BackChatPackageManifestReader : IPackageManifestReader
{
    public Task<IEnumerable<PackageManifest>> ReadPackageManifestsAsync()
    {
        var manifest = new PackageManifest
        {
            Id = Constants.PackageName,
            Name = "BackChat",
            Version = typeof(BackChatPackageManifestReader).Assembly.GetName().Version?.ToString(),
            AllowTelemetry = true,
            Extensions =
            [
                new
                {
                    name = "Back Chat Bundle",
                    alias = "BackChat.Bundle",
                    type = "bundle",
                    js = "/App_Plugins/BackChat/back-chat.js",
                },
            ],
        };

        return Task.FromResult<IEnumerable<PackageManifest>>(new[] { manifest });
    }
}
