import type { ReactNode } from "react";
import { Text, View } from "react-native";

import type { MovieDetails } from "../../utils/movies/movieDetails";

function formatRuntime(runtime: number | null) {
  if (!runtime) return null;
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours ? `${hours}h ${minutes}min` : `${minutes}min`;
}

function formatCurrency(value: number) {
  if (!value) return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[46%] flex-1 border-t border-[#292929] py-4">
      <Text className="text-xs font-semibold uppercase text-[#8e8e93]">
        {label}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-white">{value}</Text>
    </View>
  );
}

type MovieInformationProps = {
  movie: MovieDetails;
  rating?: ReactNode;
};

export default function MovieInformation({
  movie,
  rating,
}: MovieInformationProps) {
  const year = movie.release_date
    ? new Date(`${movie.release_date}T00:00:00`).getFullYear()
    : null;
  const runtime = formatRuntime(movie.runtime);
  const metadata = [year, runtime, movie.status].filter(Boolean).join("  •  ");
  const languages = movie.spoken_languages.map((item) => item.name).join(", ");
  const countries = movie.production_countries
    .map((item) => item.name)
    .join(", ");
  const companies = movie.production_companies
    .map((item) => item.name)
    .join(", ");

  return (
    <>
      {movie.original_title !== movie.title ? (
        <Text className="mt-1 text-sm text-[#8e8e93]">
          {movie.original_title}
        </Text>
      ) : null}
      {metadata ? (
        <Text className="mt-3 text-sm font-medium text-[#b8b8b8]">
          {metadata}
        </Text>
      ) : null}
      {movie.genres.length ? (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {movie.genres.map((genre) => (
            <View
              key={genre.id}
              className="rounded-full border border-[#3a3a3c] bg-[#1c1c1e] px-3 py-1.5"
            >
              <Text className="text-xs font-medium text-[#dedede]">
                {genre.name}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {rating}
      {movie.tagline ? (
        <Text className="mt-7 border-l-2 border-primary pl-4 text-base italic leading-6 text-[#d4d4d4]">
          {movie.tagline}
        </Text>
      ) : null}
      <View className="mt-8">
        <Text className="text-xl font-bold text-white">Sinopse</Text>
        <Text className="mt-3 text-base leading-7 text-[#c7c7c7]">
          {movie.overview || "Sinopse não disponível."}
        </Text>
      </View>
      <View className="mt-8">
        <Text className="mb-2 text-xl font-bold text-white">Informações</Text>
        <View className="flex-row flex-wrap gap-x-5">
          <DetailItem
            label="Lançamento"
            value={movie.release_date || "Não informado"}
          />
          <DetailItem
            label="Idioma original"
            value={movie.original_language.toUpperCase()}
          />
          <DetailItem label="Orçamento" value={formatCurrency(movie.budget)} />
          <DetailItem label="Receita" value={formatCurrency(movie.revenue)} />
          {languages ? <DetailItem label="Idiomas" value={languages} /> : null}
          {countries ? <DetailItem label="Países" value={countries} /> : null}
        </View>
      </View>
      {companies ? (
        <View className="mt-4 border-t border-[#292929] pt-6">
          <Text className="text-xl font-bold text-white">Produção</Text>
          <Text className="mt-3 text-sm leading-6 text-[#b8b8b8]">
            {companies}
          </Text>
        </View>
      ) : null}
    </>
  );
}
