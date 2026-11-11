import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statisticsService } from '../services';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSupplies, setRecentSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        statisticsService.getDashboard(),
        statisticsService.getRecentActivity(5),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (recentRes.success) setRecentSupplies(recentRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">¡Hola, {user?.nombre}!</h1>
        <p className="text-green-50">Registra y gestiona tus suministros de combustible</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_registros || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Galones</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_galones?.toFixed(2) || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <Link
          to="/nuevo-suministro"
          className="flex items-center justify-center w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition font-medium text-lg shadow-lg"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Registro de Suministro
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-bold text-gray-900">Actividad Reciente</h2>
        </div>
        <div className="divide-y">
          {recentSupplies.slice(0, 5).map((supply) => (
            <div key={supply.id} className="px-4 py-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Ficha: {supply.ficha}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(supply.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {parseFloat(supply.galones).toFixed(2)} gal
                  </p>
                  <p className="text-xs text-gray-500">
                    {supply.kilometraje.toLocaleString()} km
                  </p>
                </div>
              </div>
            </div>
          ))}
          {recentSupplies.length === 0 && (
            <p className="text-gray-500 text-center py-8">No hay registros recientes</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
