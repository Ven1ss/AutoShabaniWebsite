"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FadeIn from "@/components/ui/FadeIn";
import { useLanguage } from "@/context/LanguageContext";
import { trackEvent } from "@/lib/analytics";
import { whatsappEnquireUrl } from "@/lib/contact";
import {
  VEHICLE_ENGINES,
  VEHICLE_MAKES,
  formatVehicleLabel,
  storeVehicle,
  vehicleSearchQuery,
  vehicleWhatsAppBlurb,
  yearsForModel,
  type VehicleSelection,
} from "@/lib/vehicles";

export default function VehicleFinder() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");

  const make = useMemo(
    () => VEHICLE_MAKES.find((m) => m.id === makeId) ?? null,
    [makeId]
  );
  const model = useMemo(
    () => make?.models.find((m) => m.id === modelId) ?? null,
    [make, modelId]
  );
  const years = useMemo(
    () => (model ? yearsForModel(model.years) : []),
    [model]
  );

  function buildSelection(): VehicleSelection | null {
    if (!make || !model || !year) return null;
    const y = Number(year);
    if (!Number.isFinite(y)) return null;
    return {
      makeId: make.id,
      makeName: make.name,
      modelId: model.id,
      modelName: model.name,
      year: y,
      engine: engine.trim(),
    };
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const selection = buildSelection();
    if (!selection) return;
    storeVehicle(selection);
    trackEvent("vehicle_search", {
      make: selection.makeId,
      model: selection.modelId,
      year: String(selection.year),
    });
    const q = vehicleSearchQuery(selection);
    router.push(`/katalogu?q=${encodeURIComponent(q)}&vehicle=1`);
  }

  const selection = buildSelection();
  const wa = selection
    ? whatsappEnquireUrl(vehicleWhatsAppBlurb(selection, locale))
    : null;

  return (
    <section id="vehicle" className="border-b border-black/[0.04] bg-as-snow">
      <div className="container-as py-10 sm:py-12 md:py-14">
        <FadeIn>
          <div className="mb-6 sm:mb-8 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-as-dark">
              {t.vehicleTitle}
            </h2>
            <p className="mt-2 text-sm text-as-secondary">{t.vehicleSub}</p>
          </div>

          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-as-gray">
                {t.vehicleMake}
              </span>
              <select
                value={makeId}
                onChange={(e) => {
                  setMakeId(e.target.value);
                  setModelId("");
                  setYear("");
                }}
                className="w-full min-h-[2.75rem] rounded-control border border-as-mist bg-as-white px-3 text-sm text-as-dark outline-none focus:border-as-dark/30"
              >
                <option value="">{t.vehicleSelectMake}</option>
                {VEHICLE_MAKES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-as-gray">
                {t.vehicleModel}
              </span>
              <select
                value={modelId}
                disabled={!make}
                onChange={(e) => {
                  setModelId(e.target.value);
                  setYear("");
                }}
                className="w-full min-h-[2.75rem] rounded-control border border-as-mist bg-as-white px-3 text-sm text-as-dark outline-none focus:border-as-dark/30 disabled:opacity-50"
              >
                <option value="">{t.vehicleSelectModel}</option>
                {make?.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-as-gray">
                {t.vehicleYear}
              </span>
              <select
                value={year}
                disabled={!model}
                onChange={(e) => setYear(e.target.value)}
                className="w-full min-h-[2.75rem] rounded-control border border-as-mist bg-as-white px-3 text-sm text-as-dark outline-none focus:border-as-dark/30 disabled:opacity-50"
              >
                <option value="">{t.vehicleSelectYear}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-as-gray">
                {t.vehicleEngine}
              </span>
              <select
                value={engine}
                disabled={!model}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full min-h-[2.75rem] rounded-control border border-as-mist bg-as-white px-3 text-sm text-as-dark outline-none focus:border-as-dark/30 disabled:opacity-50"
              >
                <option value="">{t.vehicleSelectEngine}</option>
                {VEHICLE_ENGINES.filter(Boolean).map((eng) => (
                  <option key={eng} value={eng}>
                    {eng}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-1">
              <button
                type="submit"
                disabled={!selection}
                className="min-h-[2.75rem] rounded-control bg-as-dark px-4 text-sm font-medium text-white transition-colors hover:bg-as-black disabled:opacity-40"
              >
                {t.vehicleSubmit}
              </button>
            </div>
          </form>

          <p className="mt-4 text-[0.7rem] text-as-gray max-w-2xl">
            {t.vehicleFitmentNote}
            {selection ? (
              <>
                {" "}
                <span className="text-as-secondary">
                  {formatVehicleLabel(selection, locale)}
                </span>
                {wa ? (
                  <>
                    {" · "}
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent("whatsapp_click", { place: "vehicle_finder" })
                      }
                      className="font-medium text-as-dark underline underline-offset-2"
                    >
                      {t.vehicleAskWhatsApp}
                    </a>
                  </>
                ) : null}
              </>
            ) : null}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
