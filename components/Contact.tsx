'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Mail, Send, Github, Linkedin, CheckCircle } from 'lucide-react'

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.17a8.16 8.16 0 004.77 1.52V7.25a4.85 4.85 0 01-1-.56z"/>
    </svg>
  )
}

const socials = [
  {
    label: 'GitHub',
    href: 'https://github.com/AhmedGwely',
    icon: <Github size={20} />,
    handle: '@AhmedGwely',
    color: '#fff',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ahmed-gwely-2589611b0/',
    icon: <Linkedin size={20} />,
    handle: 'ahmed-gwely',
    color: '#0A66C2',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@ahmedgwely10',
    icon: <TikTokIcon size={20} />,
    handle: '@ahmedgwely10',
    color: '#FF0050',
  },
  {
    label: 'Email',
    href: 'mailto:ahmedgwbs@gmail.com',
    icon: <Mail size={20} />,
    handle: 'ahmedgwbs@gmail.com',
    color: '#00D4FF',
  },
]

export default function Contact() {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true })

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const res = await fetch('https://formspree.io/f/xnjoeqyd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setSent(true)
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        alert('❌ Failed to send message')
      }
    } catch (error) {
      alert('⚠️ Something went wrong')
    }

    setSending(false)
  }

  return (
    <section id="contact" ref={ref} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-16"
        >
          <h2 className="text-4xl font-bold text-white">
            Let’s Build Something
          </h2>
          <p className="text-gray-400 mt-2">
            AI / CV collaborations, freelance work, or ideas — I’m open.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10">

          {/* SOCIALS */}
          <div className="lg:col-span-2 space-y-4">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('mailto') ? undefined : '_blank'}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
              >
                <div style={{ color: s.color }}>{s.icon}</div>
                <div>
                  <div className="text-sm text-gray-400">{s.label}</div>
                  <div className="text-white">{s.handle}</div>
                </div>
              </a>
            ))}
          </div>

          {/* FORM */}
          <div className="lg:col-span-3">
            <div className="p-6 rounded-xl bg-white/5">

              {sent ? (
                <div className="text-center py-10">
                  <CheckCircle className="mx-auto text-green-400" size={40} />
                  <h3 className="text-white text-xl mt-3">
                    Message Sent!
                  </h3>
                  <button
                    onClick={() => setSent(false)}
                    className="text-cyan-400 mt-4"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">

                  <input
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full p-3 bg-black/30 text-white rounded"
                    required
                  />

                  <input
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full p-3 bg-black/30 text-white rounded"
                    required
                  />

                  <input
                    name="subject"
                    placeholder="Subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full p-3 bg-black/30 text-white rounded"
                    required
                  />

                  <textarea
                    name="message"
                    placeholder="Message"
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full p-3 bg-black/30 text-white rounded"
                    required
                  />

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-cyan-400 text-black font-bold p-3 rounded"
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>

                </form>
              )}

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}