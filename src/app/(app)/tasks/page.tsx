import { requireUser } from "@/lib/session";
import crypto from "crypto";
import { Card } from "@/components/ui"; // Aapke UI component ke mutabiq

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await requireUser();
  const userId = session.id;

  // Secure hash generate karna: md5(user_id + '-' + secret)
  const secret = process.env.CPX_SECURE_HASH || "";
  const secureHash = crypto.createHash("md5").update(`${userId}-${secret}`).digest("hex");

  const iframeUrl = `https://offers.cpx-research.com/index.php?app_id=37836&ext_user_id=${userId}&secure_hash=${secureHash}&username=${encodeURIComponent(session.name || "")}&email=${encodeURIComponent(session.email || "")}`;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ice">Earn More Coins</h1>
        <p className="text-mist text-sm mt-1">Complete surveys and download apps to earn big coins instantly!</p>
      </div>

      <Card className="p-0 overflow-hidden border border-line/60 rounded-xl bg-white">
        <iframe
          src={iframeUrl}
          width="100%"
          height="800px"
          frameBorder="0"
          className="w-full bg-white"
          title="Earn More Tasks"
        />
      </Card>
    </div>
  );
}