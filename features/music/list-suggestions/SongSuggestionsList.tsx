type SongSuggestionItem = {
  artist: string | null;
  createdAt: string;
  id: string;
  requesterName: string | null;
  songTitle: string;
};

type SongSuggestionsListProps = {
  suggestions: SongSuggestionItem[];
};

export function SongSuggestionsList({
  suggestions,
}: SongSuggestionsListProps) {
  if (!suggestions.length) {
    return (
      <div className="rounded-[18px] border border-midnight-navy/10 bg-white p-5">
        <p className="text-sm font-semibold text-midnight-navy">
          Aun no hay sugerencias musicales.
        </p>
        <p className="mt-1 text-sm leading-6 text-midnight-navy/62">
          Cuando actives la seccion y publiques, las respuestas apareceran aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {suggestions.map((suggestion) => (
        <article
          className="rounded-[18px] border border-midnight-navy/10 bg-white px-4 py-4"
          key={suggestion.id}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-midnight-navy">
                {suggestion.songTitle}
              </h3>
              {suggestion.artist ? (
                <p className="mt-1 text-sm text-midnight-navy/62">
                  {suggestion.artist}
                </p>
              ) : null}
            </div>
            <p className="text-xs font-semibold uppercase text-midnight-navy/45">
              {formatDate(suggestion.createdAt)}
            </p>
          </div>
          {suggestion.requesterName ? (
            <p className="mt-3 text-sm leading-6 text-midnight-navy/65">
              Sugerida por {suggestion.requesterName}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
