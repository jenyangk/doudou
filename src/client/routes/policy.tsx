import { PageTransition } from "../components/PageTransition";

export default function Policy() {
  return (
    <PageTransition>
      <div class="max-w-2xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-display font-black text-dd-text mb-6">Privacy Policy</h1>
        <div class="space-y-4 font-body text-dd-text leading-relaxed">
          <p>Your privacy matters to us.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Data We Collect</h2>
          <p>We collect your email address for authentication and the images you upload to competition sessions.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">How We Use Data</h2>
          <p>Your data is used solely to operate the competition platform. We do not sell your data to third parties.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Data Storage</h2>
          <p>Data is stored on Cloudflare infrastructure. Images are stored in Cloudflare R2.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Contact</h2>
          <p>For questions about your data, contact us at privacy@doudou.muniee.com.</p>
        </div>
      </div>
    </PageTransition>
  );
}
