import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const palette = [
  "#FCFCFC",
  "#ACA9A9",
  "#2B3543",
  "#D6380E",
  "#141618",
  "#DD5717",
  "#5A5C5F",
  "#68778A",
];

const metrics = [
  {
    label: "First pass yield",
    text: "Ratio of chargers that passed inspection on the first attempt to the total number produced, updated in real time.",
  },
  {
    label: "Retest rate",
    text: "Proportion of chargers flagged for rework after failing the initial inspection.",
  },
  {
    label: "Final yield",
    text: "Percentage of chargers that ultimately passed inspection, including units that required rework.",
  },
  {
    label: "Cycle time",
    text: "Time between the first and last inspection of the day divided by the number of chargers processed.",
  },
  {
    label: "Units per hour",
    text: "Production rate estimated from timestamped inspection logs.",
  },
];

export const metadata = {
  title: "Automated Quality Assurance Dashboard for ChargePoint | Holland Blumer",
  description:
    "A full-stack quality assurance dashboard for ChargePoint built with React, AWS Amplify, GraphQL, and computer vision workflows.",
};

function Section({ eyebrow, title, children }) {
  return (
    <section className="grid gap-5 border-t border-[rgba(252,252,252,0.18)] py-10 lg:grid-cols-[0.34fr_0.66fr] lg:py-14">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(252,252,252,0.42)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#fcfcfc] sm:text-3xl">
          {title}
        </h2>
      </div>
      <div className="space-y-5 text-base leading-8 text-[rgba(252,252,252,0.76)]">
        {children}
      </div>
    </section>
  );
}

export default function ChargePointPage() {
  return (
    <main
      className={`min-h-screen bg-[#141618] text-[#fcfcfc] ${bricolage.className}`}
    >
      <div className="mx-auto w-full max-w-[1500px] px-5 py-5 sm:px-8 sm:py-7 lg:px-10">
        <header className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(252,252,252,0.58)]">
          <a href="/" className="transition hover:text-[#fcfcfc]">
            Home
          </a>
          <span>ChargePoint QA Dashboard</span>
        </header>

        <section className="grid min-h-[calc(100vh-80px)] items-center gap-10 py-14 lg:grid-cols-[0.82fr_1.18fr] lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#dd5717]">
              ENGG 199 / Special Topics in Engineering Sciences
            </p>
            <h1 className="mt-5 max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
              Automated Quality Assurance Dashboard for ChargePoint
            </h1>
            <p className="mt-7 max-w-[39rem] text-lg leading-8 text-[rgba(252,252,252,0.76)]">
              A full-stack development project focused on improving
              manufacturing quality assurance for ChargePoint by automating
              defect detection for EV chargers using a React-based dashboard,
              AWS services, and computer vision workflows.
            </p>
          </div>

          <figure className="bg-[#fcfcfc] p-3 text-[#141618]">
            <img
              src="/projects/chargepoint.png"
              alt="ChargePoint quality assurance dashboard"
              className="h-full w-full object-cover"
            />
            <figcaption className="mt-3 text-xs leading-5 text-[#5a5c5f]">
              Screenshot of the dashboard developed and presented for
              ChargePoint. Built with React, AWS Amplify, and GraphQL to
              automate quality assurance and defect tracking before the rise of
              GenAI.
            </figcaption>
          </figure>
        </section>

        <section className="grid gap-3 border-t border-[rgba(252,252,252,0.18)] py-8 sm:grid-cols-4 lg:grid-cols-8">
          {palette.map((color) => (
            <div key={color} className="border border-[rgba(252,252,252,0.14)]">
              <div className="h-16" style={{ backgroundColor: color }} />
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(252,252,252,0.6)]">
                {color}
              </p>
            </div>
          ))}
        </section>

        <Section eyebrow="Introduction" title="Project Context">
          <p>
            As part of ENGG 199 - Special Topics in Engineering Sciences, I
            worked on a full-stack development project focused on improving
            manufacturing quality assurance for ChargePoint. This course
            provided an opportunity to apply software development, cloud
            infrastructure, and computer vision techniques in a real-world
            setting.
          </p>
          <p>
            The goal was to automate defect detection for EV chargers using a
            React-based dashboard and AWS services.
          </p>
        </Section>

        <Section eyebrow="Problem" title="Manual Inspection Was Too Slow">
          <p>
            Manufacturing high-quality EV chargers requires rigorous quality
            control, but the existing process relied heavily on manual
            inspections, leading to delays, incomplete data, and inefficiencies.
          </p>
          <p>
            ChargePoint needed an automated system to capture defect data in
            real time, reduce inspection time per unit, and improve traceability
            for defect analysis.
          </p>
        </Section>

        <Section eyebrow="Solution" title="React Dashboard + Real-Time QA Data">
          <p>
            I built a React-powered dashboard that integrates computer vision,
            cloud computing, and real-time analytics to monitor key production
            metrics, including first pass yield, retest and rework rates, final
            yield, cycle time, and takt time.
          </p>
          <p>
            The dashboard allows users to search and filter quality control data
            by serial number, factory location, and pass or fail status,
            providing engineers with instant access to critical insights.
          </p>
        </Section>

        <section className="grid gap-5 border-t border-[rgba(252,252,252,0.18)] py-10 lg:grid-cols-2 lg:py-14">
          <figure className="bg-[#fcfcfc] p-3 text-[#141618]">
            <img
              src="/projects/chargepoint.png"
              alt="ChargePoint dashboard overview"
              className="h-full w-full object-cover"
            />
            <figcaption className="mt-3 text-xs leading-5 text-[#5a5c5f]">
              Recent capture data and detailed charger view from the dashboard
              built for ChargePoint.
            </figcaption>
          </figure>
          <div className="grid content-center gap-4 border border-[rgba(252,252,252,0.16)] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#dd5717]">
              Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "React",
                "AWS Amplify",
                "Cognito",
                "AppSync",
                "GraphQL",
                "AWS S3",
                "Python",
                "SIFT",
                "Recharts.js",
                "moment.js",
              ].map((item) => (
                <span
                  key={item}
                  className="border border-[rgba(252,252,252,0.2)] px-3 py-2 text-sm text-[rgba(252,252,252,0.78)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <Section
          eyebrow="Cloud Infrastructure and Backend"
          title="Managed Services for Scale"
        >
          <p>
            Originally, the project was set up with MongoDB, but I transitioned
            to AWS Amplify and Cognito for a scalable authentication and data
            management system.
          </p>
          <p>
            Rather than building a traditional backend with custom server logic,
            I leveraged AWS managed services to handle authentication, database
            interactions, and API management. I configured AWS AppSync for
            efficient GraphQL querying and implemented AWS S3 for secure storage
            and retrieval of inspection images.
          </p>
          <p>
            This cloud-based setup ensured real-time data accessibility and
            automation while minimizing the need for direct backend maintenance.
          </p>
          <p>
            To automate quality checks, the system captured barcode and
            component images, analyzing them with SIFT and other image
            processing algorithms in Python. This enabled automated defect
            detection, reducing the need for manual inspection and improving
            error traceability.
          </p>
        </Section>

        <Section
          eyebrow="Error Tracking and Visualization"
          title="Defect Patterns Made Visible"
        >
          <p>
            I developed an interactive dashboard that categorized and visualized
            manufacturing defects. Using Recharts.js, I built bar charts for
            error frequency analysis, helping engineers identify recurring
            issues.
          </p>
          <p>
            I also implemented moment.js to calculate time-based metrics such as
            units per hour and cycle time, providing deeper insights into
            production efficiency.
          </p>
        </Section>

        <section className="border-t border-[rgba(252,252,252,0.18)] py-10 lg:py-14">
          <div className="max-w-[48rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(252,252,252,0.42)]">
              Statistical Analysis and Performance Metrics
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#fcfcfc] sm:text-3xl">
              Production Metrics in Real Time
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="border border-[rgba(252,252,252,0.16)] p-5"
              >
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#fcfcfc]">
                  {metric.label}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[rgba(252,252,252,0.68)]">
                  {metric.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <Section eyebrow="Impact" title="Hardware, Software, and Cloud">
          <p>
            This project merged hardware, software, and cloud technologies,
            improving production efficiency, defect traceability, and real-time
            quality monitoring.
          </p>
          <p>
            By automating quality control processes, the system reduced
            inspection time per unit and provided engineers with actionable
            insights to improve manufacturing performance.
          </p>
          <p className="text-[rgba(252,252,252,0.5)]">
            Due to NDA, I can discuss technical details upon request.
          </p>
        </Section>
      </div>
    </main>
  );
}
