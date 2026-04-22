const certificates = [
  {
    title: "Samsung IoT Engineering",
    file: "/certificates/Sams_IOT.jpeg",
    type: "image",
  },
  {
    title: "Samsung AI Engineering (AI Track)",
    file: "/certificates/Sams_AI-preview.jpg",
    type: "image",
  },

  {
    title: "OCI Data Science Professional",
    file: "/certificates/OL_DS.pdf",
    type: "pdf",
  },
  {
    title: "OCI Generative AI Professional",
    file: "/certificates/OL_G.pdf",
    type: "pdf",
  },
  {
    title: "Generative AI with AWS",
    file: "/certificates/aws-gen-ai.pdf",
    type: "pdf",
  },
  {
    title: "Building RAG Agents with LLMs",
    file: "/certificates/NV_RAG.pdf",
    type: "pdf",
  },
  {
    title: "ML Regression & Classification",
    file: "/certificates/SV_AJ.pdf",
    type: "pdf",
  },
  {
    title: "AI for All (GenAI Practice)",
    file: "/certificates/Gen_nvidia.pdf",
    type: "pdf",
  },

  {
    title: "Intro to Programming",
    file: "/certificates/Nvidia_DLI_ITI.png",
    type: "image",
  },
  {
    title: "Intro to Programming",
    file: "/certificates/intro.jpg",
    type: "image",
  },
  {
    title: "IBM Quantum Computing",
    file: "/certificates/Quantum.jpg",
    type: "image",
  },
];

export default function Certificates() {
  return (
    <section id="certificates" className="py-20">
      <h2 className="text-3xl font-bold text-center mb-10 text-white">
        Certificates
      </h2>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-6">
        {certificates.map((cert, index) => (
          <div
            key={index}
            className="bg-[#0f172a] p-4 rounded-xl shadow hover:scale-105 hover:shadow-cyan-500/20 transition relative"
          >
            {/* PDF badge */}
            {cert.type === "pdf" && (
              <span className="absolute top-2 right-2 bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded">
                PDF
              </span>
            )}

            {/* IMAGE CERTIFICATES */}
            {cert.type === "image" && (
              <a
                href={cert.file}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={cert.file}
                  alt={cert.title}
                  className="rounded-lg w-full h-[200px] object-cover"
                  loading="lazy"
                />
              </a>
            )}

            {/* PDF CERTIFICATES (clean + safe) */}
            {cert.type === "pdf" && (
              <a
                href={cert.file}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-full h-[200px] bg-slate-800 rounded-lg flex items-center justify-center text-white font-medium hover:bg-slate-700 transition">
                  View Certificate
                </div>
              </a>
            )}

            {/* Title */}
            <h3 className="mt-3 text-white font-semibold text-sm text-center">
              {cert.title}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}