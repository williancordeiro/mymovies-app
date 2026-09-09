import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MovieCard from "../../../src/components/MovieCard/MovieCard";
import { useMovieSearch } from "../../../src/hooks/movie";
import type { Movie } from "../../../src/utils/movie";

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);
  const term = text.trim();
  const { data, isPending, isError, refetch } = useMovieSearch(query);
  const waiting = term !== query;
  const loading = term.length > 0 && (term.length < 3 || waiting || isPending);
  const movies = term.length >= 3 && !waiting ? (data ?? []) : [];

  useEffect(() => {
    const timer = setTimeout(() => setQuery(term), 350);
    return () => clearTimeout(timer);
  }, [term]);

  const renderMovie = useCallback(
    ({ item }: { item: Movie }) => (
      <View className="flex-1 px-1.5 pb-3">
        <MovieCard movie={item} />
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
      <View className="px-6 pb-5 pt-4">
        <Text className="text-2xl font-semibold uppercase tracking-widest text-[#FF8A3D]">
          My Movies
        </Text>
        <Text className="mt-1 text-xl font-bold text-white">Buscar filmes</Text>
        <Text className="mt-2 text-base text-[#a3a3a3]">
          Encontre seu próximo filme no catálogo.
        </Text>
        <View className="mt-5 flex-row items-center gap-3 rounded-2xl bg-[#262626] pl-4 pr-1">
          <Ionicons name="search" size={22} color="#FF8A3D" accessible={false} />
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => setQuery(term)}
            accessibilityLabel="Nome do filme"
            placeholder="Nome do filme"
            placeholderTextColor="#A3A3A3"
            selectionColor="#FF8A3D"
            underlineColorAndroid="transparent"
            className="min-h-14 flex-1 py-3 text-base text-white"
            style={{ minWidth: 0 }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus
          />
          {text.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              className="h-12 w-12 items-center justify-center"
              onPress={() => {
                setText("");
                setQuery("");
                inputRef.current?.focus();
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Ionicons name="close-circle" size={22} color="#A3A3A3" accessible={false} />
            </Pressable>
          )}
        </View>
      </View>

      <FlashList
        key={query}
        style={{ flex: 1 }}
        data={movies}
        keyExtractor={(movie) => String(movie.id)}
        numColumns={2}
        renderItem={renderMovie}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 112 }}
        ListHeaderComponent={movies.length > 0 ? (
          <Text className="px-1.5 pb-4 text-base font-semibold text-white">
            Resultados da busca
          </Text>
        ) : null}
        ListEmptyComponent={
          <View className="items-center justify-center px-8 py-10" accessibilityLiveRegion="polite">
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#FF8A3D" />
                <Text className="mt-4 text-base text-[#a3a3a3]">Buscando filmes...</Text>
              </>
            ) : term && isError ? (
              <>
                <Ionicons name="cloud-offline-outline" size={52} color="#737373" accessible={false} />
                <Text className="mt-4 text-center text-lg font-semibold text-white">
                  Não foi possível buscar os filmes
                </Text>
                <Text className="mt-2 text-center text-sm leading-5 text-[#a3a3a3]">
                  Verifique sua conexão e tente novamente.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="mt-5 rounded-full bg-[#dd5d13] px-6 py-3"
                  onPress={() => refetch()}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="font-semibold text-white">Tentar novamente</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Ionicons name={term ? "film-outline" : "search-outline"} size={52} color="#737373" accessible={false} />
                <Text className="mt-4 text-center text-lg font-semibold text-white">
                  {term ? "Nenhum filme encontrado" : "Qual filme você quer assistir?"}
                </Text>
                <Text className="mt-2 text-center text-sm leading-5 text-[#a3a3a3]">
                  {term ? "Confira o nome ou tente outro título." : "Digite o nome de um filme para começar sua busca."}
                </Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
