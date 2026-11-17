import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

const CONTACT_EMAIL = "enochpaultheking@gmail.com";
const EFFECTIVE_DATE = "17 November 2026";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | తెలుగు సమాంతర బైబిల్ — Telugu Parallel Bible" },
      {
        name: "description",
        content:
          "Privacy Policy for Telugu Parallel Bible: no accounts, no personal data collected, all scripture and reading preferences kept on your device, and how to contact the developer.",
      },
      {
        property: "og:title",
        content: "Privacy Policy | Telugu Parallel Bible",
      },
      {
        property: "og:description",
        content:
          "No accounts, no tracking, no personal data collected. Your bookmarks and reading position stay on your device.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Privacy Policy | Telugu Parallel Bible" },
      {
        name: "twitter:description",
        content:
          "No accounts, no tracking, no personal data collected. Your bookmarks and reading position stay on your device.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0" aria-labelledby={id}>
      <h2
        id={id}
        className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
      >
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            search={{ b: 470, c: 1 }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back to the Bible
          </Link>
          <span className="ml-auto text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Privacy
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Privacy Policy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Telugu Parallel Bible · Effective {EFFECTIVE_DATE}
        </p>

        <div className="mt-6 rounded-lg border bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground/90">In short</p>
          <p className="mt-1">
            This app has no accounts and collects no personal information. The Bible
            texts, fonts and footnotes are built into the app, so it works without the
            internet. Your bookmarks, reading position and display settings are saved
            only on your own device and are never sent anywhere.
          </p>
        </div>

        <Section id="intro" title="1. Introduction">
          <p>
            Telugu Parallel Bible (“the App”) is a Bible reading application that helps
            you read and compare Bible translations in Telugu and English, side by side.
          </p>
          <p>
            Your privacy matters to us. This policy explains what the App does — and
            does not do — with information when you use it.
          </p>
        </Section>

        <Section id="collect" title="2. Information we collect">
          <p>
            The App does not require an account or sign-in. There is no registration
            form, no login and no user profile.
          </p>
          <p>
            We do not intentionally collect, request or store personally identifiable
            information such as your name, email address, phone number or physical
            address. We have no way to see who you are or which verses you read.
          </p>
        </Section>

        <Section id="device" title="3. What is saved on your device">
          <p>
            To make reading convenient, the App remembers a few things locally on the
            device you use:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>your bookmarks, grouped by book;</li>
            <li>the book, chapter and scroll position you last opened;</li>
            <li>the list of chapters you read most recently;</li>
            <li>
              your display choices: theme, font, text size, line spacing, gap between
              verses and which translations are visible.
            </li>
          </ul>
          <p>
            This information stays on your device. It is not uploaded to us or to any
            server, and it is removed as soon as you clear the App’s storage or site
            data in your device settings.
          </p>
        </Section>

        <Section id="offline" title="4. Offline operation">
          <p>
            The Bible translations, Telugu fonts and translation notes are bundled
            inside the App. Core reading, search and comparison work with no internet
            connection at all.
          </p>
          <p>
            Your Bible reading is not transmitted to our servers, because the App has no
            server to send it to.
          </p>
        </Section>

        <Section id="share" title="5. Copying, sharing and images">
          <p>
            Copying a verse, sharing it, and exporting a verse as an image are done on
            your device.
          </p>
          <p>
            If you use your device’s share menu, the verse text you chose is passed to
            the app you pick (for example a messaging or email app). What that app then
            does with the text is governed by its own privacy policy, not ours.
          </p>
        </Section>

        <Section id="analytics" title="6. Analytics and advertising">
          <p>
            The App does not use third-party advertising services, and it does not use
            analytics or tracking tools to follow you or build a profile of your
            behaviour.
          </p>
          <p>We do not sell, rent or share personal information with advertisers.</p>
        </Section>

        <Section id="third-party" title="7. Third-party services">
          <p>
            The App does not intentionally send personal information to external servers
            as part of its core features.
          </p>
          <p>
            However, Google Play and the Android operating system may independently
            process certain technical information — such as app installation details,
            security checks or crash diagnostics — under their own privacy policies. We
            do not control that processing. Please read Google’s and your device
            maker’s privacy notices for details.
          </p>
        </Section>

        <Section id="children" title="8. Children’s privacy">
          <p>
            The App is intended for a general audience. Because it asks for no personal
            information at all, we do not knowingly collect personal information from
            children or any other users.
          </p>
        </Section>

        <Section id="security" title="9. Data security">
          <p>
            Since the App needs no accounts and collects no personal information, we
            keep no user database that could hold personal information.
          </p>
          <p>
            What is saved sits on your device, so please keep your device secure and use
            the security features your operating system provides.
          </p>
        </Section>

        <Section id="changes" title="10. Changes to this policy">
          <p>
            We may update this policy from time to time to reflect changes in the App or
            in legal requirements. Any update will be published here with a revised
            effective date.
          </p>
        </Section>

        <Section id="contact" title="11. Contact us">
          <p>
            For questions or concerns about this policy — or if you hold a copyright in
            any translation included here and have a concern about how it is used —
            please contact the developer:
          </p>
          <p className="rounded-md border bg-background/60 px-3 py-2">
            <span className="font-semibold text-foreground/80">Email:</span>{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-primary underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>We aim to respond and address any concern promptly.</p>
        </Section>

        <p className="mt-10 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          By using Telugu Parallel Bible, you acknowledge this Privacy Policy. This
          website and app are provided solely for personal Bible study, comparison,
          education and research purposes. All Bible translation copyrights remain the
          property of their respective copyright holders; no copyright infringement is
          intended.
        </p>
      </main>
    </div>
  );
}
