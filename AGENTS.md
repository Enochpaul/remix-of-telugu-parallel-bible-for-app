<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Bundle non-Google Telugu typefaces as Lovable CDN font assets and register them with `@font-face` so the reader remains fast and repository-light.
- All Scripture text (including English KJV) is bundled as static JSON under public/bible/<version>/<book>.json; never fetch Bible text from external APIs, so the app stays offline/APK-ready.
