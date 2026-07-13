import { Download, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import type { GeneratedSeries, StoredPayload } from "../types";
import { downloadJson, readJsonFile } from "../services/exportService";

type Props = {
  payload: StoredPayload;
  activeSeries: GeneratedSeries | null;
  onImport: (payload: StoredPayload) => void;
};

export function ImportExportPage({ payload, activeSeries, onImport }: Props) {
  const [message, setMessage] = useState("");

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const nextPayload = await readJsonFile<StoredPayload>(file);
      if (nextPayload.version !== 1) {
        throw new Error("Version de fichier non prise en charge.");
      }
      onImport(nextPayload);
      setMessage("Import terminé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    }
  };

  return (
    <div className="page-grid two-columns">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Données locales</p>
          <h1>Import / export</h1>
        </div>
      </section>

      {message && <p className="info-line wide">{message}</p>}

      <section className="panel action-panel">
        <Download size={28} />
        <div>
          <h2>Exporter les données</h2>
          <p>Paramètres, favoris, historiques et automatismes personnels.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => downloadJson("tempomaths-donnees.json", payload)}>
          <Download size={18} />
          Exporter
        </button>
      </section>

      <section className="panel action-panel">
        <Upload size={28} />
        <div>
          <h2>Importer un fichier</h2>
          <p>Le fichier doit provenir d'un export TempoMaths.</p>
        </div>
        <label className="file-button">
          <Upload size={18} />
          Importer
          <input type="file" accept="application/json" onChange={importFile} />
        </label>
      </section>

      <section className="panel action-panel">
        <Download size={28} />
        <div>
          <h2>Exporter la série active</h2>
          <p>Questions, corrections, seed et réglages de génération.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={!activeSeries}
          onClick={() => activeSeries && downloadJson(`tempomaths-serie-${activeSeries.seed}.json`, activeSeries)}
        >
          <Download size={18} />
          JSON série
        </button>
      </section>
    </div>
  );
}
