# Back Chat

[![NuGet](https://img.shields.io/nuget/vpre/Umbraco.Community.BackChat?color=0273B3)](https://www.nuget.org/packages/Umbraco.Community.BackChat)

Chat for the Umbraco backoffice, for Umbraco 17.

## Building

Requirements: .NET SDK 10 (see `global.json`) and Node 24.

```
cd src/BackChat/Client
npm ci
npm run build
```

`npm run build` writes the bundle to `src/BackChat/wwwroot/App_Plugins/BackChat`. Then build the package:

```
dotnet build src/BackChat/BackChat.csproj -c Release
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
