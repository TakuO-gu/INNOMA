import NextLink from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-solid-gray-900 text-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <Image
              src="/images/logo.svg"
              alt="INNOMA"
              width={140}
              height={50}
              className="h-10 w-auto brightness-0 invert mb-4"
            />
            <p className="text-solid-gray-400 leading-relaxed max-w-sm">
              日本の自治体情報をオープンに、アクセスしやすく。
              誰もが必要な情報を見つけ、理解できる社会を目指します。
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">リンク</h4>
            <ul className="space-y-3 text-solid-gray-400">
              <li>
                <NextLink href="/municipalities" className="hover:text-white transition-colors">
                  自治体一覧
                </NextLink>
              </li>
              <li>
                <a
                  href="https://github.com/YOUR_ORG/INNOMA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-solid-gray-800 mt-12 pt-8 text-center text-solid-gray-500 text-sm space-y-2">
          <p>
            <a
              href="https://design.digital.go.jp/dads/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline"
            >
              デジタル庁デザインシステムウェブサイト
            </a>
            のコンテンツを加工して作成
          </p>
          <p>&copy; {new Date().getFullYear()} INNOMA Project. Open Source under MIT License.</p>
        </div>
      </div>
    </footer>
  );
}
