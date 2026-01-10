import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  CheckSquare,
  Edit2,
  Trash2,
  Calendar,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Folder,
  FolderPlus,
  X,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useDataStore } from '../stores/useStore';

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'red' },
  { value: 'medium', label: 'Medium', color: 'amber' },
  { value: 'low', label: 'Low', color: 'blue' },
];

const CATEGORIES = [
  'Financial',
  'Administrative',
  'Follow-up',
  'Personal',
  'Other',
];

const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const LIST_COLORS = [
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
];

const initialFormState = {
  title: '',
  description: '',
  priority: 'medium',
  category: 'Other',
  dueDate: '',
  completed: false,
  isRecurring: false,
  recurrencePattern: 'weekly',
  listId: null,
};

const initialListFormState = {
  name: '',
  color: 'indigo',
};

export default function ToDoList() {
  const { todos, lists, addTodo, updateTodo, deleteTodo, toggleTodoComplete, addList, updateList, deleteList } = useDataStore();

  const [selectedListId, setSelectedListId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // 'all', 'completed', 'pending', 'overdue'
  const [sortBy, setSortBy] = useState('dueDate'); // 'dueDate', 'priority', 'createdAt'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [listFormData, setListFormData] = useState(initialListFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set default list on mount
  useEffect(() => {
    if (lists.length > 0 && !selectedListId) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId]);

  // Filter and sort todos
  const filteredTodos = useMemo(() => {
    let filtered = [...todos];

    // List filter
    if (selectedListId) {
      filtered = filtered.filter((todo) => todo.listId === selectedListId);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter((todo) => todo.category === filterCategory);
    }

    // Priority filter
    if (filterPriority) {
      filtered = filtered.filter((todo) => todo.priority === filterPriority);
    }

    // Status filter
    if (filterStatus === 'completed') {
      filtered = filtered.filter((todo) => todo.completed);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter((todo) => !todo.completed);
    } else if (filterStatus === 'overdue') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      filtered = filtered.filter((todo) => {
        if (todo.completed || !todo.dueDate) return false;
        const dueDate = new Date(todo.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < now;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return filtered;
  }, [todos, selectedListId, searchQuery, filterCategory, filterPriority, filterStatus, sortBy]);

  // Calculate stats for current list
  const stats = useMemo(() => {
    const listTodos = selectedListId ? todos.filter((t) => t.listId === selectedListId) : todos;
    const total = listTodos.length;
    const completed = listTodos.filter((t) => t.completed).length;
    const pending = total - completed;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = listTodos.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < now;
    }).length;

    return { total, completed, pending, overdue };
  }, [todos, selectedListId]);

  const openAddModal = () => {
    setEditingTodo(null);
    setFormData({
      ...initialFormState,
      listId: selectedListId,
      dueDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openAddListModal = () => {
    setEditingList(null);
    setListFormData(initialListFormState);
    setIsListModalOpen(true);
  };

  const openEditListModal = (list) => {
    setEditingList(list);
    setListFormData({
      name: list.name || '',
      color: list.color || 'indigo',
    });
    setIsListModalOpen(true);
  };

  const handleListSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingList) {
        await updateList(editingList.id, listFormData);
      } else {
        const newListId = await addList(listFormData);
        // Switch to the new list
        setSelectedListId(newListId);
      }
      setIsListModalOpen(false);
      setListFormData(initialListFormState);
    } catch (error) {
      console.error('Failed to save list:', error);
    }

    setIsSubmitting(false);
  };

  const handleDeleteList = async (list) => {
    if (window.confirm(`Are you sure you want to delete "${list.name}"? All tasks in this list will be moved to the default list.`)) {
      await deleteList(list.id);
      // Switch to first available list
      const remainingLists = lists.filter((l) => l.id !== list.id);
      if (remainingLists.length > 0) {
        setSelectedListId(remainingLists[0].id);
      }
    }
  };

  const openEditModal = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title || '',
      description: todo.description || '',
      priority: todo.priority || 'medium',
      category: todo.category || 'Other',
      dueDate: todo.dueDate || '',
      completed: todo.completed || false,
      isRecurring: todo.isRecurring || false,
      recurrencePattern: todo.recurrencePattern || 'weekly',
      listId: todo.listId || selectedListId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const todoData = {
        listId: formData.listId || selectedListId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        dueDate: formData.dueDate || null,
        completed: formData.completed,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
      };

      if (editingTodo) {
        await updateTodo(editingTodo.id, todoData);
      } else {
        await addTodo(todoData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save todo:', error);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (todo) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTodo(todo.id);
    }
  };

  const handleToggleComplete = async (todo) => {
    await toggleTodoComplete(todo.id);
  };

  const isOverdue = (todo) => {
    if (todo.completed || !todo.dueDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(todo.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  };

  const getPriorityColor = (priority) => {
    const priorityMap = PRIORITIES.find((p) => p.value === priority);
    if (!priorityMap) return 'slate';
    return priorityMap.color;
  };

  const getPriorityStyles = (priority) => {
    const color = getPriorityColor(priority);
    const styles = {
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return styles[color] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    const diffTime = taskDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getListColorClass = (color) => {
    const colorMap = LIST_COLORS.find((c) => c.value === color);
    return colorMap?.class || 'bg-indigo-500';
  };

  const selectedList = lists.find((l) => l.id === selectedListId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">To-Do List</h1>
          <p className="text-slate-400 mt-1">Manage your tasks and stay organized</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddListModal} icon={FolderPlus} variant="secondary">
            New List
          </Button>
          <Button onClick={openAddModal} icon={Plus}>
            Add Task
          </Button>
        </div>
      </div>

      {/* List Selector */}
      <Card>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-slate-400">Lists:</span>
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                selectedListId === list.id
                  ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${getListColorClass(list.color)}`} />
              <span className="text-sm font-medium">{list.name}</span>
              {lists.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditListModal(list);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-white/10"
                  aria-label="Edit list"
                >
                  <Edit2 size={12} />
                </button>
              )}
              {lists.length > 1 && list.name !== 'Default' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-red-500/20 text-red-400"
                  aria-label="Delete list"
                >
                  <X size={12} />
                </button>
              )}
            </button>
          ))}
        </div>
        {selectedList && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Showing tasks from: <span className="text-white font-medium">{selectedList.name}</span>
            </p>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <CheckSquare size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Tasks</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Completed</p>
              <p className="text-xl font-bold text-white">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <AlertCircle size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Overdue</p>
              <p className="text-xl font-bold text-white">{stats.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-slate-400">Sort by:</span>
          <div className="flex gap-2">
            {['dueDate', 'priority', 'createdAt'].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === sort
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {sort === 'dueDate' ? 'Due Date' : sort === 'priority' ? 'Priority' : 'Newest'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Todo List */}
      <div className="space-y-3">
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => {
            const overdue = isOverdue(todo);
            const priorityStyles = getPriorityStyles(todo.priority);
            const priorityLabel = PRIORITIES.find((p) => p.value === todo.priority)?.label || todo.priority;

            return (
              <Card
                key={todo.id}
                className={`transition-all ${
                  todo.completed
                    ? 'opacity-60'
                    : overdue
                    ? 'border border-red-500/50 bg-red-500/5'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                      todo.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-400 hover:border-emerald-400'
                    }`}
                  >
                    {todo.completed && <CheckCircle2 size={14} className="text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3
                        className={`font-semibold text-lg ${
                          todo.completed ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {todo.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs border ${priorityStyles}`}
                        >
                          {priorityLabel}
                        </span>
                        {todo.isRecurring && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>

                    {todo.description && (
                      <p
                        className={`text-sm mb-3 ${
                          todo.completed ? 'text-slate-500 line-through' : 'text-slate-300'
                        }`}
                      >
                        {todo.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-white/5">{todo.category}</span>
                      </div>
                      {todo.dueDate && (
                        <div
                          className={`flex items-center gap-1 ${
                            overdue && !todo.completed
                              ? 'text-red-400'
                              : todo.completed
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          <Calendar size={14} />
                          {formatDueDate(todo.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(todo)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="Edit"
                    >
                      <Edit2 size={18} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(todo)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="text-center py-12">
            <CheckSquare size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No tasks found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery || filterCategory || filterPriority || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'}
            </p>
            {!searchQuery && !filterCategory && !filterPriority && filterStatus === 'all' && (
              <Button onClick={openAddModal} icon={Plus}>
                Add Task
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData(initialFormState);
        }}
        title={editingTodo ? 'Edit Task' : 'Add New Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter task title"
            required
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter task description (optional)"
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="List *"
              value={formData.listId || ''}
              onChange={(e) => setFormData({ ...formData, listId: parseInt(e.target.value) })}
              required
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>

            <Select
              label="Priority *"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-slate-400"
              />
              <span className="text-sm font-medium text-slate-300">Recurring Task</span>
            </label>

            {formData.isRecurring && (
              <Select
                label="Recurrence Pattern"
                value={formData.recurrencePattern}
                onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value })}
              >
                {RECURRENCE_PATTERNS.map((pattern) => (
                  <option key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {editingTodo && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.completed}
                onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-slate-400"
              />
              <span className="text-sm font-medium text-slate-300">Completed</span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setFormData(initialFormState);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingTodo ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit List Modal */}
      <Modal
        isOpen={isListModalOpen}
        onClose={() => {
          setIsListModalOpen(false);
          setListFormData(initialListFormState);
        }}
        title={editingList ? 'Edit List' : 'Create New List'}
        size="md"
      >
        <form onSubmit={handleListSubmit} className="space-y-4">
          <Input
            label="List Name *"
            value={listFormData.name}
            onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })}
            placeholder="Enter list name"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
            <div className="grid grid-cols-4 gap-2">
              {LIST_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setListFormData({ ...listFormData, color: color.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    listFormData.color === color.value
                      ? 'border-white scale-110'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className={`w-full h-8 rounded ${color.class}`} />
                  <span className="text-xs text-slate-400 mt-1 block">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsListModalOpen(false);
                setListFormData(initialListFormState);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingList ? 'Update List' : 'Create List'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

