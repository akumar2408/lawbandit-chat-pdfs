import Uploader from '@/components/Uploader';
import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl md:text-3xl font-bold">LawBandit – Chat with PDFs</h1>
      <p className="text-sm text-gray-300 mt-1">
        Upload cases or long articles, then ask page-specific questions. Answers include page numbers and supporting snippets.
      </p>

      <div className="mt-6" />
      <Uploader /> {/* <- no onIndexed prop */}

      <div className="mt-4 grid gap-2">
        <Chat />
      </div>
    </main>
  );
}
