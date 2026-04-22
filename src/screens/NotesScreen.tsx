import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { FAB, IconButton, Searchbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { useData } from '../context/DataContext';
import { RootStackParamList, TabsParamList } from '../navigation/types';
import { designTokens } from '../theme';
import { Note } from '../db';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, 'Notes'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function snippet(body: string, max = 140): string {
  const stripped = body.replace(/[#*_`>~\-]+/g, '').replace(/\s+/g, ' ').trim();
  return stripped.length > max ? stripped.slice(0, max) + '…' : stripped;
}

export default function NotesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { notes, updateNote, deleteNote } = useData();
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLocaleLowerCase('tr').includes(q) ||
        n.body.toLocaleLowerCase('tr').includes(q)
    );
  }, [notes, query]);

  const togglePin = async (note: Note) => {
    await updateNote({ ...note, pinned: !note.pinned, updatedAt: new Date().toISOString() });
  };

  const renderItem = ({ item }: { item: Note }) => (
    <GlassCard style={{ marginBottom: designTokens.spacing.md }} padding="lg">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {item.pinned ? (
              <MaterialCommunityIcons name="pin" size={16} color={theme.colors.tertiary} />
            ) : null}
            <Text
              style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, flex: 1 }]}
              numberOfLines={1}
            >
              {item.title || 'Başlıksız Not'}
            </Text>
          </View>
          <Text
            style={[designTokens.typography.body, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}
            numberOfLines={3}
          >
            {snippet(item.body)}
          </Text>
          <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: 6 }]}>
            {new Date(item.updatedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={{ flexDirection: 'column' }}>
          <IconButton
            icon={item.pinned ? 'pin-off' : 'pin'}
            size={20}
            onPress={() => togglePin(item)}
          />
          <IconButton
            icon="pencil-outline"
            size={20}
            onPress={() => navigation.navigate('NoteEditor', { id: item.id })}
          />
          <IconButton
            icon="trash-can-outline"
            size={20}
            onPress={() => deleteNote(item.id)}
          />
        </View>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.root}>
      <GradientBackground />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <View style={[styles.container, { maxWidth: isWide ? 1000 : undefined, alignSelf: 'center', width: '100%' }]}>
          <Searchbar
            value={query}
            onChangeText={setQuery}
            placeholder="Notlarda ara"
            style={styles.search}
          />
          {filtered.length === 0 ? (
            <GlassCard style={{ marginTop: designTokens.spacing.lg, alignItems: 'center' }}>
              <MaterialCommunityIcons name="notebook-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[designTokens.typography.subtitle, { marginTop: 8, color: theme.colors.onSurface }]}>
                Henüz not yok
              </Text>
              <Text
                style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}
              >
                Sağ alttaki + ile markdown destekli ilk notunuzu oluşturun.
              </Text>
            </GlassCard>
          ) : (
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={(n) => n.id}
              contentContainerStyle={{ paddingTop: designTokens.spacing.md, paddingBottom: 120 }}
            />
          )}
        </View>
      </SafeAreaView>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('NoteEditor')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: designTokens.spacing.lg, paddingTop: designTokens.spacing.md },
  search: { borderRadius: designTokens.radius.md },
  fab: { position: 'absolute', right: 20, bottom: 20 },
});
