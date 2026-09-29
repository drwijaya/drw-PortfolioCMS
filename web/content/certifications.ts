import type { Certification } from '@/lib/types'

export const certifications: Certification[] = [
  {
    name: "Make Agentic AI Work for You",
    issuer: "IBM",
    issued: "Jun 2026",
    credentialUrl: "https://www.credly.com/badges/a19329b0-ad56-4587-b5ba-5415e6b303d5/linked_in_profile",
    skills: ["Langflow"],
    order: 0,
  },
  {
    name: "Getting Started with Data",
    issuer: "IBM",
    issued: "Jun 2026",
    credentialUrl: "https://www.credly.com/badges/5c6d40e0-53da-4007-b09f-6a2e98097abb/linked_in_profile",
    skills: ["Python", "Data Analysis"],
    order: 1,
  },
  {
    name: "SAP01 Fundamentals",
    issuer: "SAP",
    issued: "Sep 2024",
    credentialId: "550170157",
    credentialUrl: "https://drive.google.com/file/d/17cpx2kuzA7nsXkoejJ4V0mkYA9ftiwtz/view?usp=drivesdk",
    skills: ["Enterprise Resource Planning (ERP)", "SAP ERP"],
    order: 2,
  },
]
