import { siteSettings } from '@/lib/cms/read'
import { contactCopy } from '@/lib/cms/contact-copy'
import { cmsEnabled } from '@/lib/cms/db'
import { connection } from 'next/server'

import { ContactForm } from '@/components/contact/ContactForm'
import { Cascade } from '@/components/motion/Cascade'
import { PageHeader } from '@/components/ui/PageHeader'
import { getContactMailConfig } from '@/lib/contact-mail'
import { getProfile } from '@/lib/content'
import styles from '@/app/(site)/contact/contact.module.css'

export async function ContactSection() {
  // Delivery settings live in the running container, not in the build.
  await connection()
  const profile = await getProfile()
  const settings=await siteSettings()
  const copy={...contactCopy,...(settings?.contact as {copy?:Record<string,string>})?.copy}
  const formAvailable = cmsEnabled() || getContactMailConfig() !== null

  return (
    <div className={styles.page}>
      <PageHeader first as="h1" label={copy.heading} />

      <div className={styles.root}>
        <Cascade className={styles.intro} index={1}>
          <h2 className={`${styles.headline} display`}>{copy.headline}</h2>
          <p className={styles.lead}>
            {copy.lead}
          </p>
        </Cascade>

        <div className={`${styles.layout} ${formAvailable ? '' : styles.single}`}>
          {formAvailable ? (
            <Cascade className={styles.formPanel} index={2}>
              <h3 className={styles.sectionTitle}>{copy.formTitle}</h3>
              <p className={styles.sectionCopy}>
                {copy.formDescription}
              </p>
              <ContactForm fallbackEmail={profile.email} copy={copy} />
            </Cascade>
          ) : (
            <Cascade className={styles.formPanel} index={2}>
              <h3 className={styles.sectionTitle}>Get in touch</h3>
              <p className={styles.sectionCopy}>
                The contact form is temporarily unavailable. Email me directly
                and I&apos;ll reply there.
              </p>
              <a className={styles.emailAction} href={`mailto:${profile.email}`}>
                Write an email <span aria-hidden="true">↗</span>
              </a>
              <a href={`mailto:${profile.email}`} className={styles.email}>
                {profile.email}
              </a>
            </Cascade>
          )}

          {formAvailable && (
            <Cascade className={styles.aside} index={3}>
              <h3 className={styles.sectionTitle}>{copy.directTitle}</h3>
              <p className={styles.sectionCopy}>
                {copy.directDescription}
              </p>
              <a href={`mailto:${profile.email}`} className={styles.email}>
                {profile.email}
              </a>
            </Cascade>
          )}
        </div>
      </div>
    </div>
  )
}
