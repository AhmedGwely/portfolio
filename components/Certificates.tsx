'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Award, X, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, FileText } from 'lucide-react'

const certificates = [
  // Engineering
  { id:20, title:'Samsung AI Engineering', issuer:'Samsung Innovation Campus', category:'Engineering', color:'#1428A0', emoji:'📱', file:'/certificates/Samsung_AI_Engineering.jpg', preview:'/certificates/Samsung_AI_Engineering.png', type:'image' as const },
  { id:21, title:'Samsung IOT Engineering', issuer:'Samsung', category:'Engineering', color:'#1428A0', emoji:'🏆', file:'/certificates/Sams_IOT.jpeg', preview:'/certificates/Sams_IOT.jpeg', type:'image' as const },
  // Computer Vision
  { id:1, title:'Deep Learning for Computer Vision', issuer:'Professional Course', category:'Computer Vision', color:'#00D4FF', emoji:'👁', file:'/certificates/Deep_Learning_For_computer_Vision.pdf', preview:'/certificates/previews/Deep_Learning_For_computer_Vision.png', type:'pdf' as const },
  { id:2, title:'Computer Vision Applications', issuer:'Professional Course', category:'Computer Vision', color:'#00D4FF', emoji:'🎯', file:'/certificates/Computer_Vision_Applications.pdf', preview:'/certificates/previews/Computer_Vision_Applications.png', type:'pdf' as const },
  // AI & ML
  { id:5, title:'AI for All: From Basics to GenAI', issuer:'NVIDIA', category:'AI & ML', color:'#7C3AED', emoji:'🧠', file:'/certificates/AI_for_All_From_Basics_to_GenAI.pdf', preview:'/certificates/previews/AI_for_All_From_Basics_to_GenAI_Practice_AI_for_All_From_Basics_to_GenAI_Practice_-_Nvidia.png', type:'pdf' as const },
  { id:6, title:'Building LLM Applications with Prompt Engineering', issuer:'NVIDIA', category:'AI & ML', color:'#7C3AED', emoji:'💬', file:'/certificates/Building_LLM_Applications.pdf', preview:'/certificates/previews/Building_LLM_Applications_With_Prompt_Engineering.png', type:'pdf' as const },
  { id:7, title:'RAG — Retrieval-Augmented Generation', issuer:'NVIDIA', category:'AI & ML', color:'#7C3AED', emoji:'🔗', file:'/certificates/RAG_Nvdia.pdf', preview:'/certificates/previews/RAG_Nvdia.png', type:'pdf' as const },
  { id:8, title:'Introducing Generative AI with AWS', issuer:'Amazon Web Services', category:'AI & ML', color:'#FF9900', emoji:'☁️', file:'/certificates/Introducing_Generative_AI_with_AWS.pdf', preview:'/certificates/previews/Introducing_Generative_AI_with_AWS.png', type:'pdf' as const },
  { id:9, title:'ITI Generative AI', issuer:'ITI Egypt', category:'AI & ML', color:'#7C3AED', emoji:'🎓', file:'/certificates/ITI_Gen_AI.pdf', preview:'/certificates/previews/ITI_Gen_AI.png', type:'pdf' as const },
  { id:10, title:'Oracle Generative AI Professional', issuer:'Oracle', category:'AI & ML', color:'#FF0000', emoji:'🌐', file:'/certificates/Orcale GEN AI.pdf', preview:'/certificates/previews/Orcale_GEN_AI.png', type:'pdf' as const },
  // Machine Learning
  { id:11, title:'Supervised ML: Regression & Classification', issuer:'DeepLearning.AI / Coursera', category:'Machine Learning', color:'#06FFA5', emoji:'📊', file:'/certificates/Supervised_ML.pdf', preview:'/certificates/previews/Supervised_Machine_Learning_Regression_and_Classification.png', type:'pdf' as const },
  { id:12, title:'Introduction to Deep Learning', issuer:'Professional Course', category:'Machine Learning', color:'#06FFA5', emoji:'🧬', file:'/certificates/introduction_to_deep_learning.pdf', preview:'/certificates/previews/introduction_to_deep_learning.png', type:'pdf' as const },
  // Data Science
  { id:13, title:'Data Science Capstone', issuer:'IBM / Coursera', category:'Data Science', color:'#FFD700', emoji:'📈', file:'/certificates/Data_Science_Capstone.pdf', preview:'/certificates/previews/Data_Science_Capstone.png', type:'pdf' as const },
  { id:14, title:'Data Analysis with Python', issuer:'IBM / Coursera', category:'Data Science', color:'#FFD700', emoji:'🐍', file:'/certificates/data_analysis_with_python.pdf', preview:'/certificates/previews/data_analysis_with_python.png', type:'pdf' as const },
  { id:15, title:'Data Visualization with Python', issuer:'IBM / Coursera', category:'Data Science', color:'#FFD700', emoji:'📉', file:'/certificates/data visualisation with python.pdf', preview:'/certificates/previews/data_visualisation_with_python.png', type:'pdf' as const },
  { id:16, title:'Oracle Data Science Professional', issuer:'Oracle', category:'Data Science', color:'#FF0000', emoji:'🗄️', file:'/certificates/Orcale_DataScience.pdf', preview:'/certificates/previews/Orcale_DataScience.png', type:'pdf' as const },
  { id:17, title:'Oracle Data Science Badge', issuer:'Oracle', category:'Data Science', color:'#FF0000', emoji:'🔴', file:'/certificates/DS_b.jpg', preview:'/certificates/DS_b.jpg', type:'image' as const },
  // Programming
  { id:18, title:'Python for AI and Data Science', issuer:'IBM / Coursera', category:'Programming', color:'#FF6B6B', emoji:'🐍', file:'/certificates/python_for_AI_and_Data_science.pdf', preview:'/certificates/previews/python_for_AI_and_Data_science.png', type:'pdf' as const },
  // Quantum
  { id:22, title:'Quantum Computing Introduction', issuer:'GUC × Qiskit Fallfest', category:'Quantum', color:'#8B5CF6', emoji:'⚛️', file:'/certificates/quantum-intro-GUC_Qiskit_Fallfest_cert.jpg', preview:'/certificates/quantum-intro-GUC_Qiskit_Fallfest_cert.jpg', type:'image' as const },
  // Projects
]

const CATEGORIES = ['All','Computer Vision','AI & ML','Machine Learning','Data Science','Programming','Engineering','Projects','Quantum']

// ── Modal ────────────────────────────────────────────────────────────────────
function CertificateModal({ cert, onClose, onPrev, onNext, index, total }: {
  cert: typeof certificates[number]; onClose:()=>void; onPrev:()=>void; onNext:()=>void; index:number; total:number
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)' }}
      onClick={(e)=>{ if(e.target===e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale:0.92, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.92, opacity:0 }}
        transition={{ type:'spring', stiffness:320, damping:30 }}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{ background:'rgba(10,10,20,0.97)', border:`1px solid ${cert.color}30`, boxShadow:`0 0 60px ${cert.color}18` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex-1 min-w-0 pr-4">
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color:cert.color }}>{cert.category}</span>
            <h3 className="font-semibold text-white text-base mt-0.5 leading-snug line-clamp-1">{cert.title}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{cert.issuer}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={cert.file} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 text-xs font-medium transition-colors hover:text-white"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <ExternalLink size={12}/>{cert.type==='pdf'?'Open PDF':'Open'}
            </a>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 transition-all hover:text-white hover:bg-red-500/20">
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* Viewer — PDF → <iframe>  |  image → <img> */}
        <div className="bg-[#080810]" style={{ height:'68vh' }}>
          {cert.type==='pdf' ? (
            <iframe
              src={`${cert.file}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full"
              title={cert.title}
              style={{ border:'none' }}
            />
          ) : (
            <img src={cert.file} alt={cert.title} className="w-full h-full object-contain"/>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onPrev} className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm">
            <ChevronLeft size={15}/> Previous
          </button>
          <span className="font-mono text-xs text-slate-600">{index+1} / {total}</span>
          <button onClick={onNext} className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm">
            Next <ChevronRight size={15}/>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
function CertCard({ cert, index, inView, onClick }: {
  cert: typeof certificates[number]; index:number; inView:boolean; onClick:()=>void
}) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <motion.div
      initial={{ opacity:0, y:24 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:0.45, delay:index*0.045 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden"
      style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${cert.color}18`, transition:'transform 0.2s, box-shadow 0.2s' }}
      whileHover={{ scale:1.02, boxShadow:`0 8px 32px ${cert.color}22` }}
    >
      {/* Preview thumbnail */}
      <div className="relative overflow-hidden" style={{ height:180, background:'#0a0a14' }}>
        {!imgErr ? (
          <img
            src={cert.preview}
            alt={cert.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={()=>setImgErr(true)}
          />
        ) : (
          // Fallback placeholder shown when image fails
          <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background:`${cert.color}08` }}>
            <FileText size={32} style={{ color:cert.color, opacity:0.6 }}/>
            <span className="text-xs font-mono" style={{ color:cert.color, opacity:0.7 }}>{cert.emoji} {cert.type.toUpperCase()}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background:'rgba(0,0,0,0.52)' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background:cert.color }}>
            <ZoomIn size={14}/> View
          </div>
        </div>

        {/* PDF badge */}
        {cert.type==='pdf' && (
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase"
            style={{ background:`${cert.color}25`, color:cert.color, border:`1px solid ${cert.color}40` }}>
            <FileText size={9}/> PDF
          </span>
        )}
      </div>

      {/* Text */}
      <div className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color:cert.color }}>{cert.category}</div>
        <h3 className="text-slate-200 text-sm font-semibold leading-snug line-clamp-2 group-hover:text-white transition-colors">{cert.title}</h3>
        <p className="text-slate-600 text-xs mt-1">{cert.issuer}</p>
      </div>
    </motion.div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function Certificates() {
  const { ref, inView } = useInView({ threshold:0.05, triggerOnce:true })
  const [filter, setFilter] = useState('All')
  const [selectedIdx, setSelectedIdx] = useState<number|null>(null)

  const filtered = filter==='All' ? certificates : certificates.filter(c=>c.category===filter)

  const closeModal = () => setSelectedIdx(null)
  const prevCert  = () => setSelectedIdx(i => i!==null ? (i-1+filtered.length)%filtered.length : null)
  const nextCert  = () => setSelectedIdx(i => i!==null ? (i+1)%filtered.length : null)

  return (
    <section id="certificates" ref={ref} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:30 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.7 }} className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="font-mono text-[#7C3AED] text-sm">05.</span>
            <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">Credentials</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(124,58,237,0.4)] to-transparent"/>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-100">
              Certificates &amp; <span style={{ color:'#7C3AED' }}>Credentials</span>
            </h2>
            <div className="flex items-center gap-2 rounded-xl px-4 py-2"
              style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)' }}>
              <Award size={15} style={{ color:'#7C3AED' }}/>
              <span className="font-mono text-sm text-slate-400">{certificates.length} certificates</span>
            </div>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <motion.div initial={{ opacity:0 }} animate={inView?{ opacity:1 }:{}} transition={{ delay:0.2 }} className="flex gap-2 flex-wrap mb-10">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={()=>setFilter(cat)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={filter===cat
                ? { background:'#7C3AED', color:'#fff', boxShadow:'0 0 20px rgba(124,58,237,0.4)' }
                : { background:'rgba(255,255,255,0.04)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.06)' }}>
              {cat}
              {cat!=='All' && <span className="ml-1.5 text-[10px] opacity-60">({certificates.filter(c=>c.category===cat).length})</span>}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((cert,i) => (
            <CertCard key={cert.id} cert={cert} index={i} inView={inView} onClick={()=>setSelectedIdx(i)}/>
          ))}
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity:0 }} animate={inView?{ opacity:1 }:{}} transition={{ delay:0.9 }} className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Computer Vision', count:certificates.filter(c=>c.category==='Computer Vision').length, color:'#00D4FF' },
            { label:'AI & ML',         count:certificates.filter(c=>c.category==='AI & ML').length,         color:'#7C3AED' },
            { label:'Data Science',    count:certificates.filter(c=>c.category==='Data Science').length,    color:'#FFD700' },
            { label:'Programming',     count:certificates.filter(c=>c.category==='Programming').length,     color:'#FF6B6B' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center"
              style={{ background:`${s.color}08`, border:`1px solid ${s.color}20` }}>
              <div className="font-bold text-3xl mb-1" style={{ color:s.color }}>{s.count}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Modal */}
      {selectedIdx!==null && (
        <CertificateModal
          cert={filtered[selectedIdx]}
          onClose={closeModal}
          onPrev={prevCert}
          onNext={nextCert}
          index={selectedIdx}
          total={filtered.length}
        />
      )}
    </section>
  )
}
