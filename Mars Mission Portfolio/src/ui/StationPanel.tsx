"use client";

import { certifications } from "@/content/certifications";
import { education } from "@/content/education";
import { experience, type Role } from "@/content/experience";
import { projects } from "@/content/projects";
import { EARLY_CAREER, type Station, stations } from "@/content/stations";
import { type Stop, stops } from "@/content/stops";
import { ui } from "@/content/ui";
import { moonFlyby, transit, type Visit } from "@/scene/transitRuntime";

export function RoleCard({ role }: { role: Role }) {
  return (
    <article className="role">
      <h3>
        {role.title}
        {role.fullTitle && <span className="role-full"> ({role.fullTitle})</span>}
      </h3>
      <p className="role-meta">
        {role.company} · {role.type} · {role.start} to {role.end ?? ui.dock.present} · {role.location}
      </p>
      {role.badge && <p className="role-badge">{role.badge}</p>}
      {role.summary && <p>{role.summary}</p>}
      {role.highlights && (
        <ul className="role-highlights">
          {role.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <ul className="chips" aria-label="Skills">
        {role.skills.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </article>
  );
}

function Experience({ station }: { station: Station }) {
  const roles = station.company
    ? experience.filter((r) => r.company === station.company)
    : experience.filter((r) => EARLY_CAREER.includes(r.company));
  return (
    <>
      {roles.map((r) => (
        <RoleCard key={`${r.company}${r.title}${r.start}`} role={r} />
      ))}
    </>
  );
}

function Education() {
  return (
    <>
      {education.map((e) => (
        <article key={e.school} className="role">
          <h3>
            {e.degree}, {e.field}
          </h3>
          <p className="role-meta">
            {e.school} · {e.start} to {e.end} · {e.location}
          </p>
          <p className="panel-kicker">{ui.dock.coursework}</p>
          <ul className="chips">
            {e.coursework.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </article>
      ))}
    </>
  );
}

function Certifications() {
  return (
    <ul className="cert-list">
      {certifications.map((c) => (
        <li key={c.name} className="role">
          <h3>{c.name}</h3>
          <p className="role-meta">
            {c.issuer} · {c.date} · {c.tag}
          </p>
          {c.credentialId && (
            <p className="role-meta">
              {ui.dock.credential}: <code>{c.credentialId}</code>
            </p>
          )}
          {c.url && (
            <a href={c.url} target="_blank" rel="noopener noreferrer">
              {ui.dock.verify}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function Project({ id }: { id: string }) {
  const p = projects.find((x) => x.id === id);
  if (!p) return null;
  return (
    <article className="role">
      <h3>{p.name}</h3>
      <p>{p.summary}</p>
      {p.parts && (
        <>
          <p className="panel-kicker">{ui.dock.parts}</p>
          <ul className="chips">
            {p.parts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      )}
      <p className="panel-kicker">{ui.dock.tech}</p>
      <ul className="chips">
        {p.tech.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      {p.url ? (
        <a href={p.url} target="_blank" rel="noopener noreferrer">
          {p.url}
        </a>
      ) : (
        <p className="role-meta">{ui.dock.noLink}</p>
      )}
    </article>
  );
}

function StationContent({ station }: { station: Station }) {
  return (
    <>
      {station.kind === "experience" && <Experience station={station} />}
      {station.kind === "education" && <Education />}
      {station.kind === "certifications" && <Certifications />}
      {station.kind === "project" && station.project && <Project id={station.project} />}
    </>
  );
}

const FLYBY_ALTITUDE_KM = 100;

function StopContent({ stop }: { stop: Stop }) {
  const status = transit.stopStatus[stop.id];
  const fly = stop.id === "moon" ? moonFlyby(FLYBY_ALTITUDE_KM) : null;
  const highlights = (stop.highlights ?? []).flatMap((h) => {
    const role = experience.find((r) => r.company === h.company && r.title === h.title);
    const text = role?.highlights?.[h.highlight];
    return role && text ? [{ role, text }] : [];
  });
  return (
    <>
      <p>{stop.what}</p>
      <dl className="planner-rows">
        <div>
          <dt>{ui.stops.reference}</dt>
          <dd>{stop.reference}</dd>
        </div>
        {status?.angleDeg != null && (
          <div>
            <dt>{ui.stops.geometry}</dt>
            <dd>{status.forced ? ui.stops.forced : ui.stops.onPath(status.angleDeg)}</dd>
          </div>
        )}
      </dl>
      {stop.facts && (
        <>
          <p className="panel-kicker">{ui.stops.facts}</p>
          <ul className="role-highlights">
            {stop.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      )}
      {fly && (
        <>
          <p className="panel-kicker">{ui.stops.flyby}</p>
          <p>{ui.stops.flybyNote(fly.vInf, FLYBY_ALTITUDE_KM, (fly.turn * 180) / Math.PI, fly.deltaV)}</p>
        </>
      )}
      {highlights.length > 0 && (
        <>
          <p className="panel-kicker">{ui.stops.highlights}</p>
          <ul className="role-highlights">
            {highlights.map(({ role, text }) => (
              <li key={text}>
                {text} <span className="role-meta">({role.title}, {role.company})</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {stop.absorbs.map((id) => {
        const station = stations.find((s) => s.id === id);
        return station ? <StationContent key={id} station={station} /> : null;
      })}
    </>
  );
}

/** What opens when the ship docks: one part of the portfolio per station or stop. */
export function StationPanel({ visit }: { visit: Visit }) {
  const station = visit.kind === "station" ? stations[visit.station] : undefined;
  const stop = visit.kind === "stop" ? stops.find((s) => s.id === visit.stop) : undefined;
  return (
    <div className="station-body">
      {station && <StationContent station={station} />}
      {stop && <StopContent stop={stop} />}
    </div>
  );
}
