import apiClient from './client.js';

const invoicesAPI = {
  async getAll() {
    const invoices = await apiClient.get('/api/invoices');
    return invoices.map(invoice => ({
      ...invoice,
      id: invoice._id,
    }));
  },

  async getById(id) {
    const invoice = await apiClient.get(`/api/invoices/${id}`);
    return {
      ...invoice,
      id: invoice._id,
    };
  },

  async add(invoice) {
    const newInvoice = await apiClient.post('/api/invoices', invoice);
    return {
      ...newInvoice,
      id: newInvoice._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/invoices/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/invoices/${id}`);
  },
};

export default invoicesAPI;
