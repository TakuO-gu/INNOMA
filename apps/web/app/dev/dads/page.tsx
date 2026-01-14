import BuildingBlocksMainArea from "./BuildingBlocksMainArea";

export default function DadsDevPage() {
  return (
    <main className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">DADS Token Check</h1>
        <p className="opacity-80">
          ここは「DADSトークン/テーマがビルドに乗っているか」を確認するページです。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Figma Card — variants</h2>
        <div className="grid grid-cols-3 gap-4">
          <BuildingBlocksMainArea state="Default" />
          <BuildingBlocksMainArea state="Default" showEndIcon={false} />
          <BuildingBlocksMainArea state="Default" propFunction={true} />

          <BuildingBlocksMainArea state="Hover" />
          <BuildingBlocksMainArea state="Hover" propFunction={true} />
          <BuildingBlocksMainArea state="Hover" showEndIcon={false} />

          <BuildingBlocksMainArea state="Focus" />
          <BuildingBlocksMainArea state="Focus" propFunction={true} />
          <BuildingBlocksMainArea state="Default" showEndIcon={true} />
        </div>
      </section>
    </main>
  );
}
