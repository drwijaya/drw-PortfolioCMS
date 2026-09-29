// Source: "TUGAS AKHIR FINAL.docx" in web/content/case-studies/source-materials,
// the final-year
// thesis. Experiments were run on 5 August 2026.
//
// The client is anonymised as PT XYZ in the thesis itself, and stays anonymous
// here. No individual other than me is named.
//
// The work stops at a verified and validated design. It was never installed on
// the production line, so no claim is made about actual defect reduction.
import type { CaseStudy } from '@/lib/types'

export const bobbinSensorDoe: CaseStudy = {
  slug: "bobbin-sensor-doe",
  presentationType: "case-study",
  eyebrow: "Final-year thesis · Design of experiments",
  title: "Designing a Bobbin Run-Out Detector, Testing Its Placement",
  client: "PT XYZ, denim garment manufacturer",
  subtitle:
    "A sewing bobbin runs out where nobody can see it. I built the detector that catches it early, then ran an experiment to decide where to mount it.",
  overview: {
    summary:
      "I designed and bench-tested a bobbin run-out detector, then used a 2² full factorial experiment to choose its sensor position. The confirmed 5 mm, 30° setting reached 98.05% detection and 16.85 dB signal-to-noise.",
    role:
      "I worked as the sole researcher across problem framing, prototype design, experiment planning, data analysis and confirmation testing.",
    objectives: [
      "Detect an empty bobbin before the seam fails",
      "Build a reliable infrared sensing prototype",
      "Measure the effects of sensor distance and angle",
      "Confirm one mounting specification with experimental evidence",
    ],
  },
  snapshot: {
    challenge:
      "The bobbin sits inside its case, so the first sign the thread has run out is a seam that has already failed.",
    delivered:
      "A rotation-counting detector with a buzzer and display, and a mounting specification chosen by a 2² full factorial experiment.",
    outcome:
      "5 mm at 30° gives 98.05% detection rate and 16.85 dB signal-to-noise, both confirmed inside the 95% prediction interval.",
  },
  engineeringLens: {
    system:
      "The lockstitch sewing station, its bobbin thread supply, and the moment that supply runs out.",
    objective:
      "Turn an invisible condition into a signal the operator receives before the stitching fails.",
    stakeholders:
      "Sewing operators, production supervision, the company's evaluation panel, and me as sole researcher.",
    constraints: [
      "5 mm minimum clearance around the bobbin case",
      "TCRT5000 operating range of 0.2 to 15 mm",
      "No angle-response curve published in the datasheet",
      "Bench rig only, off the production line",
    ],
    methods: [
      "Interview and observation",
      "Fishbone analysis",
      "2² full factorial DOE",
      "ANOVA and desirability",
      "Confirmation run",
    ],
  },
  evidence: {
    level: "E2",
    name: "Verified and validated design",
    summary:
      "A confirmation run placed both responses inside their 95% prediction intervals, and the company panel rated all four evaluation aspects as met.",
    sourceNote: "Final-year thesis, PT XYZ case study. Experiments run 5 August 2026.",
    limit:
      "One prototype, one operator, one bench rig. That establishes repeatability, not reproducibility, and no effect on the production defect rate was measured.",
  },
  hero: {
    src: "/img/case-studies/bobbin-sensor-doe/prototype.png",
    alt: "Bobbin thread detection prototype: a cased display unit wired to an infrared sensor on a printed holder",
    caption:
      "The prototype: an infrared sensor on a printed holder, wired to a display, buzzer and reset button.",
    plate: true,
  },
  meta: [
    {
      label: "Role",
      value: "Sole researcher: experiment design, prototype build, and analysis",
    },
    {
      label: "Team",
      value: "Individual final-year thesis",
    },
    {
      label: "Timeline",
      value: "November 2025 to August 2026",
    },
    {
      label: "Project type",
      value: "Industrial Engineering thesis",
    },
  ],
  stack: [
    "Design of Experiments",
    "2² Full Factorial",
    "ANOVA",
    "Desirability Function",
    "ESP32",
    "Arduino C++",
    "Python",
  ],
  sections: [
    {
      id: "problem",
      label: "problem",
      lead: "Sewing produced 71.8% of the factory's defects, and one cause was a bobbin running out with nobody watching.",
      blocks: [
        {
          type: "lead",
          html:
            "PT XYZ makes denim trousers. Across nine months it produced 318,423 pieces and recorded 6,017 defective ones, a rate of 1.9% against its own 1.5% tolerance. Sewing accounted for 4,322 of them.",
        },
        {
          type: "stats",
          entries: [
            {
              value: "1.9%",
              label: "Defect rate",
              note: "Against a 1.5% internal tolerance",
              tone: "bad",
            },
            {
              value: "71.8%",
              label: "Traced to sewing",
              note: "4,322 of 6,017 defective pieces",
              tone: "bad",
            },
            {
              value: "0",
              label: "Ways to see the bobbin",
              note: "It turns inside a closed case while the machine runs",
              tone: "bad",
            },
          ],
        },
        {
          type: "text",
          html:
            "In a lockstitch seam the bobbin supplies the lower thread. When it empties, the stitch stops forming a lock and the seam pulls apart. The operator finds out by looking at ruined fabric.",
        },
        {
          type: "figure",
          src: "/img/case-studies/bobbin-sensor-doe/fishbone.png",
          alt: "Fishbone diagram tracing sewing defects to man, machine, and method causes",
          caption:
            "Man, machine and method all lead to the same place: the remaining thread cannot be observed while the machine is running.",
          plate: true,
          wide: true,
        },
      ],
    },
    {
      id: "method",
      label: "method",
      lead: "To find a sensor placement that holds up, I ran a 2² full factorial rather than changing one factor at a time.",
      blocks: [
        {
          type: "text",
          html:
            "An infrared sensor's reflected signal depends on both the distance to the target and the angle it sits at. Testing one and then the other never puts both at their high level together, so a joint effect stays invisible.",
        },
        {
          type: "list",
          variant: "numbered",
          entries: [
            {
              title: "Fix the design constants first",
              body: "Reference rotation count, calibration constant, thresholds and warning level, so every run computes from the same base.",
            },
            {
              title: "Two factors, two levels, full factorial",
              body: "Distance at 5 and 15 mm, angle at 0° and 30°. All four combinations, so main effects and the interaction are all estimable.",
            },
            {
              title: "Three replications, re-mounted each time",
              body: "The sensor comes off the rig and goes back on between replicates. Mounting error is part of what I am measuring, not something to hide.",
            },
            {
              title: "Two responses, not one",
              body: "Detection rate for counting reliability, signal-to-noise ratio for signal quality. They are not the same question.",
            },
            {
              title: "Confirm before recommending",
              body: "One extra run at the chosen setting, checked against the model's 95% prediction interval.",
            },
          ],
        },
        {
          type: "callout",
          title: "Why the levels are 5 mm and 15 mm",
          body:
            "Not a guess. <strong>5 mm</strong> is the smallest clearance the bobbin case actually leaves, measured on the floor. <strong>15 mm</strong> is the top of the sensor's published operating range. The sensor's peak response sits near 2.5 mm, but that leaves no room to mount or re-adjust anything.",
        },
      ],
    },
    {
      id: "explore",
      label: "explore",
      lead: "Three sources set the fixed points: one operator interview, one shop-floor measurement, and one line missing from the datasheet.",
      blocks: [
        {
          type: "cards",
          cols: 3,
          entries: [
            {
              num: "01",
              title: "Interview",
              body: "An operator gave the number I could not observe: a warning at 10% thread remaining still leaves time to swap the bobbin. They also wanted light or sound, because their eyes are on the fabric.",
            },
            {
              num: "02",
              title: "Observation",
              body: "Watching the sewing area confirmed the eyes-on-fabric answer and produced the constraint nobody had stated: 5 mm of free space around the bobbin case, and no more.",
            },
            {
              num: "03",
              title: "Datasheet",
              body: "The TCRT5000 is characterised against distance and nothing else. There is no angle-response curve. That absence is the reason this project needed an experiment at all.",
            },
          ],
        },
        {
          type: "text",
          html:
            "The 10% figure only becomes useful once it is a number the system can count. Unwinding 20 m of thread while counting spool rotations gave an operational reference of 890 rotations, so the warning fires at 801. This was direct counting, not traceable calibration against an independent rotation standard. The display reports remaining rotations, not remaining thread length: the last rotations unwind less thread as the coil shrinks.",
        },
      ],
    },
    {
      id: "hardware",
      label: "hardware",
      lead: "To read a hidden bobbin without touching it, the design turns one reflective mark into one pulse per rotation.",
      blocks: [
        {
          type: "text",
          html:
            "The spool face is dark and absorbs most infrared, so the phototransistor barely conducts. A 5 mm white line crossing the sensor spikes the reflection, and that voltage step is the whole measurement. One mark means one pulse means one rotation.",
        },
        {
          type: "figure",
          src: "/img/case-studies/bobbin-sensor-doe/reflective-mark.png",
          alt: "A sewing machine bobbin spool with a single white reflective mark on its dark face",
          caption:
            "The entire sensing mechanism. Dark surface, one white line, 890 rotations to a full bobbin.",
          plate: true,
        },
        {
          type: "cards",
          cols: 2,
          entries: [
            {
              num: "HW1",
              title: "Sense without contact, in almost no space",
              body: "A TCRT5000 carries its emitter and receiver in one package, so distance and angle collapse into a single mounting position rather than two things to align.",
            },
            {
              num: "HW2",
              title: "Never drop a count while transmitting",
              body: "An ESP32 DevKit V1 has two cores. Interrupt-driven pulse capture sits on one, serial and Wi-Fi transmission on the other, so sending data cannot stall the counter.",
            },
            {
              num: "HW3",
              title: "Warn someone whose eyes are on the fabric",
              body: "Buzzer and LED for the alert, a 16×2 I2C LCD for status. The interview said operators do not look at displays while sewing, so the alert cannot depend on one.",
            },
            {
              num: "HW4",
              title: "Reset at the machine, not at a laptop",
              body: "One push button with two behaviours: short press starts and stops counting, long press zeroes it. Changing a bobbin should not require a computer.",
            },
          ],
        },
        {
          type: "table",
          compact: true,
          head: ["Component", "Pin", "ESP32"],
          rows: [
            ["TCRT5000 sensor", "AO · analogue out", "GPIO 35"],
            ["TCRT5000 sensor", "DO · digital out", "GPIO 27"],
            ["LCD 16×2 I2C", "SDA · SCL", "GPIO 21 · GPIO 19"],
            ["Buzzer", "signal", "GPIO 26"],
            ["LED indicator", "signal", "GPIO 25"],
            ["Push button", "signal", "GPIO 4"],
          ],
          note: "Both sensor outputs are wired. The analogue line carries the amplitude the signal-to-noise ratio is computed from; the digital line carries the sensor's own comparator, kept as a reference against my threshold logic.",
        },
        {
          type: "gallery",
          entries: [
            {
              src: "/img/case-studies/bobbin-sensor-doe/prototype.png",
              label: "The assembled unit",
              alt: "Assembled bobbin detection prototype with an LCD in a printed case",
            },
            {
              src: "/img/case-studies/bobbin-sensor-doe/sensor-mount.png",
              label: "The sensor on its adjustable holder, facing the spool",
              alt: "Close view of the infrared sensor mounted on a printed holder facing a bobbin spool",
            },
            {
              src: "/img/case-studies/bobbin-sensor-doe/rig.png",
              label: "The rig: motor, PWM control, spool mount",
              alt: "Test rig internals showing a motor, PWM controller and spool mount",
            },
          ],
        },
        {
          type: "text",
          html:
            "The rig matters as much as the prototype. Every replication needs the sensor removed and re-set to the same distance and angle, so the holder had to return to a repeatable position twelve times.",
        },
      ],
    },
    {
      id: "software",
      label: "software",
      lead: "To make one mark count exactly once, the firmware uses two thresholds and three time filters, and logs every edge it rejects.",
      blocks: [
        {
          type: "text",
          html:
            "A reading that flickers around a single threshold counts one mark several times. So a pulse is only accepted when the signal falls past a lower threshold and then rises back past an upper one. Hysteresis, in other words, rather than a single trip point.",
        },
        {
          type: "callout",
          title: "Why rejected edges are saved",
          body:
            "This is the decision the whole experiment rests on. If the firmware silently dropped ambiguous edges, <strong>detection rate would measure my filter instead of the sensor placement.</strong> Every rejection is written to the run file, so a missed rotation stays visible as a missed rotation.",
        },
        {
          type: "figure",
          src: "/img/case-studies/bobbin-sensor-doe/signal-strong.png",
          alt: "Live signal trace where every dip crosses the lower threshold and every rotation is accepted as a pulse",
          caption:
            "A strong mark. Every dip clears the lower threshold, and the accepted-pulse ticks along the bottom are evenly spaced.",
          plate: true,
          wide: true,
        },
        {
          type: "figure",
          src: "/img/case-studies/bobbin-sensor-doe/signal-weak.png",
          alt: "Live signal trace where several dips fail to reach the lower threshold and no pulse is recorded",
          caption:
            "A weak reflection at the same settings. Several dips stop short of the threshold, the ticks below go missing, and those gaps are exactly what detection rate counts.",
          plate: true,
          wide: true,
        },
        {
          type: "table",
          compact: true,
          head: ["Requirement", "What I built", "Accepted when"],
          rows: [
            [
              "Record amplitude for signal quality",
              "Fixed-rate analogue sampling, with a guard time around every state change",
              "The run file carries amplitude at a fixed rate, with mark and background statistics",
            ],
            [
              "Change parameters without re-flashing",
              "Every value lifted out into a config file, editable from the interface",
              "A parameter changed in the UI takes effect with no re-upload",
            ],
            [
              "Trace a run with no companion document",
              "One self-contained file per run, headed with the run identity and every parameter in force",
              "The file stands alone and can be read months later",
            ],
            [
              "Watch the signal while a run is going",
              "A web monitor with live signal, thread remaining, spool speed and signal statistics",
              "All four panels track the system in real time",
            ],
            [
              "Let someone else recompute the numbers",
              "A separate Python script that reads the raw CSV and recalculates both responses",
              "The recomputed values match what the firmware reported",
            ],
          ],
          note: "The last row is the one I would defend hardest. Firmware that both measures and reports its own score is not evidence.",
        },
        {
          type: "figure",
          src: "/img/case-studies/bobbin-sensor-doe/doe-log.png",
          alt: "Web monitoring interface showing a DOE run log with distance, angle, replicate, detection rate and SNR per run",
          caption:
            "The monitor doubles as the experiment log. Twelve runs produce a lot of numbers, and hand-typing them is how a transcription error reaches an ANOVA table.",
          plate: true,
          wide: true,
        },
        {
          type: "list",
          variant: "plain",
          entries: [
            {
              title: "Firmware and its config",
              body: "Interrupt-driven counting, amplitude capture, remaining-thread arithmetic, and the LED, buzzer and LCD. Pins, thresholds, debounce and calibration constants all sit in a separate config header with safe bounds.",
            },
            {
              title: "Monitoring interface",
              body: "Shows thread status live and writes each run to CSV. It is also where parameters get changed, so the board never has to be re-flashed mid-session.",
            },
            {
              title: "Analysis script",
              body: "Recalculates SNR and detection rate straight from the recorded CSV, independent of both the firmware and the interface.",
            },
          ],
        },
        {
          type: "text",
          html:
            "Each run file holds two tables: periodic samples with time, amplitude, read state and running count, then one row per pulse with its interval, mark width and amplitude statistics during the mark and during the background.",
        },
      ],
    },
    {
      id: "experiment",
      label: "experiment",
      lead: "Twelve runs: two distances, two angles, three full re-mounts each, measured on detection rate and signal-to-noise ratio.",
      blocks: [
        {
          type: "text",
          html:
            "Thread draw speed was held at 25 cm per second. Spool speed still varied from 260 to 975 rpm, because the coil diameter shrinks as the thread unwinds. I recorded it per run rather than pretending it was constant. All twelve runs took place in one session on 5 August 2026, without blocking. Randomization was limited because changing the mounting position required rebuilding and adjusting the rig; time-order effects therefore remain a limitation.",
        },
        {
          type: "table",
          compact: true,
          head: ["Distance", "Angle", "Detection rate", "SD", "SNR", "SD"],
          rows: [
            ["5 mm", "0°", "<strong>98.99%</strong>", "0.5618", "12.89 dB", "3.1754"],
            ["15 mm", "0°", "95.54%", "3.1467", "<strong>23.30 dB</strong>", "1.4775"],
            ["5 mm", "30°", "98.05%", "<strong>0.5543</strong>", "16.85 dB", "4.3124"],
            ["15 mm", "30°", "97.87%", "0.8102", "11.52 dB", "0.4282"],
          ],
          note: "Means of three replications each. The two responses point at different winners, which is the problem the rest of the analysis has to solve.",
        },
        {
          type: "figure",
          src: "/img/case-studies/bobbin-sensor-doe/boxplot.png",
          alt: "Boxplots of detection rate and SNR for each of the four treatment combinations",
          caption:
            "15 mm at 0° wins on SNR and is the worst thing on the page for detection rate: its spread runs from 92.4% to 98.7% across three identical set-ups.",
          plate: true,
          wide: true,
        },
      ],
    },
    {
      id: "analyze",
      label: "analyze",
      lead: "The interaction carried 59.38% of the SNR variation, and the distance effect reversed direction when the angle changed.",
      blocks: [
        {
          type: "figure",
          src: "/img/case-studies/bobbin-sensor-doe/interaction-plot.png",
          alt: "Interaction plot showing crossing lines for distance and angle on both responses",
          caption:
            "The lines cross. That is an antagonistic interaction, and it means neither factor has an answer of its own.",
          plate: true,
          wide: true,
        },
        {
          type: "table",
          compact: true,
          head: ["Source", "DF", "Adj SS", "F", "p", "Contribution"],
          rows: [
            ["Model", "3", "251.32", "10.79", "<strong>0.003</strong>", "80.19%"],
            ["A · distance", "1", "19.36", "2.49", "0.153", "6.18%"],
            ["B · angle", "1", "45.84", "5.91", "<strong>0.041</strong>", "14.63%"],
            ["A × B", "1", "186.12", "23.98", "<strong>0.001</strong>", "<strong>59.38%</strong>"],
            ["Error", "8", "62.09", "–", "–", "19.81%"],
          ],
          note: "ANOVA for signal-to-noise ratio, α = 0.05. The interaction outweighs both main effects together, which is why a distance recommendation on its own would be meaningless.",
        },
        {
          type: "compare",
          entries: [
            ["Move 5 → 15 mm at 0°", "SNR rises 10.42 dB"],
            ["Move 5 → 15 mm at 30°", "SNR falls 5.34 dB"],
            ["Tilt 0 → 30° at 5 mm", "SNR rises 3.97 dB"],
            ["Tilt 0 → 30° at 15 mm", "SNR falls 11.79 dB"],
          ],
        },
        {
          type: "callout",
          title: "Detection rate had nothing significant to say",
          body:
            "No term reached significance at α = 0.05, and experimental error absorbed <strong>53.67%</strong> of the variation. Across all four combinations detection rate stayed between 95.54% and 98.99%. Read honestly, that means the four set-ups are statistically indistinguishable on the response I care about most, so the choice had to be made on other grounds.",
        },
        {
          type: "text",
          html:
            "The two responses also pull against each other: Pearson r of −0.6005, p = 0.039. Better signal quality tended to come with worse counting. That is the opposite of what I expected when I picked the two responses.",
        },
      ],
    },
    {
      id: "outcome",
      label: "outcome",
      lead: "5 mm at 30°, confirmed inside the 95% prediction interval, and stated as a pair rather than as two numbers.",
      blocks: [
        {
          type: "text",
          html:
            "With detection rate unable to separate the four, I ranked on repeatability and on a combined desirability index. 5 mm at 30° has the smallest detection-rate spread and is the only combination that avoids finishing last on either response.",
        },
        {
          type: "metrics",
          entries: [
            { count: 98.05, decimals: 2, suffix: "%", label: "Detection rate", sub: "Confirmation run: 98.09%", tone: "good" },
            { count: 16.85, decimals: 2, suffix: " dB", label: "Signal-to-noise", sub: "Confirmation run: 17.06 dB", tone: "good" },
            { count: 59.38, decimals: 2, suffix: "%", label: "Variation from interaction", sub: "Against 6.18% for distance alone" },
            { count: 12, label: "Experimental runs", sub: "Four combinations, three re-mounts each" },
          ],
        },
        {
          type: "callout",
          title: "The finding, stated as a rule",
          body:
            "Sensor mounting has to be specified as a <strong>distance-and-angle pair</strong>, not as two independent tolerances. The same 10 mm move helps at one angle and hurts at the other, so a spec sheet listing them separately would be wrong at least half the time.",
        },
        {
          type: "list",
          variant: "plain",
          entries: [
            {
              title: "Verified, then validated",
              body: "The confirmation run put both responses inside their 95% prediction intervals. Separately, the company panel evaluated fit, operator usability, safety and quality potential, and rated all four as met.",
            },
            {
              title: "Repeatability, not reproducibility",
              body: "One prototype, one operator, one rig, one session. Whether a second unit on a second machine behaves the same way is untested.",
            },
            {
              title: "The counting is what was measured",
              body: "Detection rate is the share of rotations counted correctly. It is not the share of real run-out events caught on a production line, and 98.05% is not 100%.",
            },
            {
              title: "It needs recalibration on change",
              body: "The 890-rotation reference holds for the bobbin and thread tested. A different thread means measuring it again.",
            },
          ],
        },
        {
          type: "callout",
          title: "What would come next",
          body:
            "Add centre points to test for curvature, fully randomise the run order, and widen the factor set to thread type and colour. Then a limited trial on a few machines before anyone considers the full line.",
        },
      ],
    },
  ],
}
