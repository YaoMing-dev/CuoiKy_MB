import React from 'react';
import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { COLORS, SIZES } from '../../config/constants';

export default function InfiniteList({
  data,
  renderItem,
  keyExtractor,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isRefetching,
  onRefresh,
  emptyIcon = '🔍',
  emptyText = 'Nothing found',
  numColumns = 1,
  contentContainerStyle,
  ...rest
}) {
  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>{emptyIcon}</Text>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || false}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      contentContainerStyle={[{ paddingBottom: SIZES.xl }, contentContainerStyle]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.xl },
  emptyIcon: { fontSize: 48, marginBottom: SIZES.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
  footer: { paddingVertical: SIZES.lg, alignItems: 'center' },
});
