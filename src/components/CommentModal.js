import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, Text, IconButton, Avatar, Divider } from 'react-native-paper';
import { collection, query, where, orderBy, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { COLORS, SIZES } from '../config/constants';

export default function CommentModal({ visible, onDismiss, feedItemId, targetType, targetName }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && feedItemId) {
      loadComments();
    }
  }, [visible, feedItemId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'comments'),
        where('feedItemId', '==', feedItemId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(items);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      const user = auth.currentUser;
      
      await addDoc(collection(db, 'comments'), {
        feedItemId,
        targetType,
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || 'Anonymous User',
        userAvatar: user?.photoURL || null,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return 'just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch (e) {
      return 'just now';
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={s.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.container}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Comments</Text>
            <IconButton icon="close" size={24} onPress={onDismiss} />
          </View>
          <Divider />

          {/* Target info */}
          <View style={s.targetInfo}>
            <Text style={s.targetText} numberOfLines={1}>
              {targetType === 'place' ? '📍' : '📅'} {targetName}
            </Text>
          </View>
          <Divider />

          {/* Comments list */}
          {loading ? (
            <View style={s.center}>
              <Text>Loading comments...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={s.center}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={s.emptyText}>No comments yet</Text>
              <Text style={s.emptyHint}>Be the first to comment!</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={s.commentItem}>
                  <Avatar.Text
                    size={36}
                    label={(item.userName?.[0] || 'U').toUpperCase()}
                    style={{ backgroundColor: COLORS.primary }}
                  />
                  <View style={s.commentContent}>
                    <View style={s.commentHeader}>
                      <Text style={s.commentUser}>{item.userName}</Text>
                      <Text style={s.commentTime}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    <Text style={s.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <Divider style={{ marginVertical: 8 }} />}
              contentContainerStyle={{ padding: SIZES.md }}
            />
          )}

          {/* Input */}
          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <IconButton
              icon="send"
              size={24}
              iconColor={newComment.trim() ? COLORS.primary : '#999'}
              onPress={handleSubmit}
              disabled={!newComment.trim() || submitting}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const s = StyleSheet.create({
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  container: {
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: SIZES.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  targetInfo: {
    padding: SIZES.sm,
    backgroundColor: '#F5F5F5',
  },
  targetText: {
    fontSize: 13,
    color: '#666',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
});
