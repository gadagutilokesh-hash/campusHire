// Campus Announcements & Events Service
import { mockAnnouncements, mockUpcomingEvents } from '../data/mockAnnouncements';
import { apiResponse, delay } from './api';

let announcementsState = [...mockAnnouncements];

export const announcementService = {
  async getAnnouncements() {
    await delay(120);
    return apiResponse(announcementsState);
  },

  async getUpcomingEvents() {
    await delay(120);
    return apiResponse(mockUpcomingEvents);
  },

  async markAsRead(id) {
    announcementsState = announcementsState.map((a) =>
      a.id === id ? { ...a, read: true } : a
    );
    return apiResponse({ id });
  },

  async broadcastAnnouncement(newAnn) {
    await delay(200);
    const created = {
      id: `ann_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      pinned: false,
      ...newAnn,
    };
    announcementsState = [created, ...announcementsState];
    return apiResponse(created, 'Announcement broadcasted to student portal!');
  },
};
