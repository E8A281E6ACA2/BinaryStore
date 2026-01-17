"use client";

import React, { useState, useEffect } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

type SessionItem = {
  id: string;
  userId: string;
  userEmail: string | null;
  createdAt: string;
  lastAccessAt: string | null;
  expiresAt: string | null;
  userAgent: string | null;
  ip: string | null;
  revoked: boolean;
  meta: any;
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export default function SessionManager({ initialSessions }: { initialSessions: SessionItem[] }) {
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions || []);
  const [loading, setLoading] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [total, setTotal] = useState<number | null>(null);
  const [emailQuery, setEmailQuery] = useState<string>('');
  const [revokedFilter, setRevokedFilter] = useState<'all' | 'true' | 'false'>('all');

  useEffect(() => {
    // load first page when component mounts if no initialSessions
    if (!initialSessions || initialSessions.length === 0) {
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSessions(p = page) {
    setLoading('fetch');
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('pageSize', String(pageSize));
      if (emailQuery) params.set('email', emailQuery);
      if (revokedFilter !== 'all') params.set('revoked', revokedFilter === 'true' ? 'true' : 'false');

      const res = await fetch('/api/admin/sessions?' + params.toString(), { credentials: 'same-origin' });
      const j = await res.json();
      if (j.ok) {
        setSessions(j.sessions || []);
        setTotal(typeof j.total === 'number' ? j.total : null);
        setPage(j.page || p);
      } else {
        alert(j.message || '加载会话失败');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert('网络错误，加载失败');
    } finally {
      setLoading(null);
    }
  }

  async function exportCSV() {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (emailQuery) params.set('email', emailQuery);
    if (revokedFilter !== 'all') params.set('revoked', revokedFilter === 'true' ? 'true' : 'false');
    params.set('export', 'csv');
    params.set('exportAll', 'true');
    try {
      setLoading('export');
      const res = await fetch('/api/admin/sessions?' + params.toString(), { credentials: 'same-origin' });
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = res.headers.get('Content-Disposition');
      let filename = 'sessions.csv';
      if (cd) {
        const m = cd.match(/filename="?(.*?)"?$/);
        if (m) filename = m[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert('导出失败');
    } finally {
      setLoading(null);
    }
  }

  async function revoke(id: string) {
    // will be handled by confirm modal flow
    setPendingAction({ type: 'revoke', sessionId: id });
  }

  async function revokeAllForUser(userId: string) {
    // will be handled by confirm modal flow
    setPendingAction({ type: 'revokeAllForUser', userId });
  }

  // pending action state for modal
  const [pendingAction, setPendingAction] = useState<any | null>(null);

  async function onModalConfirm() {
    if (!pendingAction) return;
    const act = pendingAction;
    setPendingAction(null);
    if (act.type === 'revoke') {
      const id = act.sessionId as string;
      setLoading(id);
      try {
        const res = await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ action: 'revoke', sessionId: id }),
        });
        const j = await res.json();
        if (j.ok) {
          setSessions((s) => s.map((it) => (it.id === id ? { ...it, revoked: true } : it)));
        } else {
          alert(j.message || '撤销失败');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        alert('网络错误，撤销失败');
      } finally {
        setLoading(null);
      }
    } else if (act.type === 'revokeAllForUser') {
      const userId = act.userId as string;
      setLoading('revokeAll-' + userId);
      try {
        const res = await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ action: 'revokeAllForUser', userId }),
        });
        const j = await res.json();
        if (j.ok) {
          // mark sessions of that user as revoked locally
          setSessions((s) => s.map((it) => (it.userId === userId ? { ...it, revoked: true } : it)));
        } else {
          alert(j.message || '撤销失败');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        alert('网络错误，撤销失败');
      } finally {
        setLoading(null);
      }
    }
  }

  function onModalCancel() {
    setPendingAction(null);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="mb-4 flex items-center space-x-2">
          <input className="border p-2" placeholder="按用户邮箱搜索" value={emailQuery} onChange={(e) => setEmailQuery(e.target.value)} />
          <select value={revokedFilter} onChange={(e) => setRevokedFilter(e.target.value as any)} className="border p-2">
            <option value="all">全部</option>
            <option value="false">有效</option>
            <option value="true">已撤销</option>
          </select>
          <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); fetchSessions(1); }} className="border p-2">
            <option value={10}>10 / 页</option>
            <option value={20}>20 / 页</option>
            <option value={50}>50 / 页</option>
            <option value={100}>100 / 页</option>
          </select>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => fetchSessions(1)} disabled={loading === 'fetch'}>
            查询
          </button>
          <button className="px-3 py-1 border rounded" onClick={exportCSV} disabled={loading === 'export'}>
            导出 CSV
          </button>
        </div>

        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">会话 ID</th>
              <th className="p-2">用户</th>
              <th className="p-2">创建时间</th>
              <th className="p-2">最后访问</th>
              <th className="p-2">过期</th>
              <th className="p-2">IP</th>
              <th className="p-2">UA</th>
              <th className="p-2">状态</th>
              <th className="p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2 font-mono text-xs max-w-xs truncate">{s.id}</td>
                <td className="p-2">{s.userEmail ?? s.userId}</td>
                <td className="p-2">{formatDate(s.createdAt)}</td>
<td className="p-2">{s.lastAccessAt ? formatDate(s.lastAccessAt) : '-'}</td>
<td className="p-2">{s.expiresAt ? formatDate(s.expiresAt) : '-'}</td>
                <td className="p-2">{s.ip ?? '-'}</td>
                <td className="p-2 max-w-sm truncate">{s.userAgent ?? '-'}</td>
                <td className="p-2">{s.revoked ? '已撤销' : '有效'}</td>
                <td className="p-2">
                  <div className="flex items-center space-x-2">
                    <button
                      className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                      onClick={() => revoke(s.id)}
                      disabled={s.revoked || loading === s.id}
                    >
                      {s.revoked ? '撤销' : loading === s.id ? '处理中...' : '撤销'}
                    </button>
                    <button
                      className="px-2 py-1 bg-yellow-500 text-white rounded disabled:opacity-50 text-sm"
                      onClick={() => revokeAllForUser(s.userId)}
                      disabled={loading === 'revokeAll-' + s.userId}
                    >
                      撤销该用户全部
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div>总计: {total ?? sessions.length}</div>
          <div className="space-x-2">
            <button className="px-3 py-1 border rounded" onClick={() => { if (page > 1) { setPage(page-1); fetchSessions(page-1); } }} disabled={page <= 1 || loading === 'fetch'}>上一页</button>
            <span>第 {page} 页</span>
            <button className="px-3 py-1 border rounded" onClick={() => { setPage(page+1); fetchSessions(page+1); }} disabled={loading === 'fetch' || (total !== null && page * pageSize >= total)}>下一页</button>
          </div>
        </div>
      </div>
      {/* Confirm modal */}
      <ConfirmModal
        open={!!pendingAction}
        title={pendingAction?.type === 'revoke' ? '撤销会话' : '撤销该用户所有会话'}
        message={pendingAction?.type === 'revoke' ? '确定要撤销此会话？' : '确定要撤销该用户的所有会话？此操作会终止该用户的所有活动会话。'}
        onConfirm={onModalConfirm}
        onCancel={onModalCancel}
        confirmText="确认"
        cancelText="取消"
      />
    </>
  );
}

