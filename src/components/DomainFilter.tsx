import type { AppSettings, Automatisme, MathDomain } from "../types";
import { domainLabels, domainTone } from "../utils/labels";
import { getAvailableDomains } from "../utils/filters";

type Props = {
  settings: AppSettings;
  automatismes: Automatisme[];
  onChange: (next: Partial<AppSettings>) => void;
};

export function DomainFilter({ settings, automatismes, onChange }: Props) {
  const domains = getAvailableDomains(
    automatismes,
    settings
  );

  const toggleDomain = (domain: MathDomain) => {
    const selectedDomains = settings.selectedDomains.includes(domain)
      ? settings.selectedDomains.filter((item) => item !== domain)
      : [...settings.selectedDomains, domain];
    onChange({ selectedDomains });
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Domaines</p>
          <h2>Filtres</h2>
        </div>
        <button type="button" className="ghost-button" onClick={() => onChange({ selectedDomains: [] })}>
          Tout
        </button>
      </div>

      <div className="domain-cloud">
        {domains.map((domain) => (
          <button
            key={domain}
            type="button"
            className={[
              "domain-chip",
              domainTone[domain],
              settings.selectedDomains.includes(domain) ? "selected" : ""
            ].join(" ")}
            onClick={() => toggleDomain(domain)}
          >
            {domainLabels[domain]}
          </button>
        ))}
      </div>
    </section>
  );
}
