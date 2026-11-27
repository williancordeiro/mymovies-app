import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type SearchMovie = { id: number; title: string };

type Props = {
  text: string;
  query: string;
  movies?: SearchMovie[];
  isSearchPending: boolean;
  isAddPending: boolean;
  addError?: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  onAdd: (movieId: number) => void;
};

export default function PlaylistMovieSearch({
  text,
  query,
  movies,
  isSearchPending,
  isAddPending,
  addError,
  onTextChange,
  onSubmit,
  onAdd,
}: Props) {
  return (
    <>
      <TextInput
        value={text}
        onChangeText={onTextChange}
        placeholder="Buscar filme para adicionar"
        placeholderTextColor="#a3a3a3"
        accessibilityLabel="Buscar filme para adicionar"
        className="mt-5 min-h-12 rounded-xl bg-[#1c1c1e] px-4 text-white"
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {query.length >= 3 ? (
        <View className="mt-3">
          {isSearchPending ? (
            <ActivityIndicator color="#e07000" />
          ) : (
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              indicatorStyle="white"
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingRight: 4 }}
            >
              {movies?.map((movie) => (
                <Pressable
                  key={movie.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Adicionar ${movie.title}`}
                  accessibilityState={{
                    disabled: isAddPending,
                    busy: isAddPending,
                  }}
                  disabled={isAddPending}
                  onPress={() => onAdd(movie.id)}
                  className="mb-2 min-h-16 justify-center rounded-xl border border-[#4a4a4c] px-4 py-3"
                >
                  <Text
                    numberOfLines={2}
                    className="font-semibold leading-5 text-white"
                  >
                    {movie.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
      {addError ? (
        <Text accessibilityLiveRegion="polite" className="mt-2 text-[#ff8a80]">
          {addError}
        </Text>
      ) : null}
    </>
  );
}
