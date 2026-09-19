/* Daily check-off habits share Ritme's existing storage and backup. */
window.RitmeHabits = (() => {
  'use strict';
  const validDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const validId = value => typeof value === 'string' && /^h-[a-zA-Z0-9-]{1,90}$/.test(value);
  function definitions(input) {
    const seen = new Set();
    return (Array.isArray(input) ? input : []).filter(habit => {
      if (!habit || !validId(habit.id) || seen.has(habit.id) ||
          typeof habit.name !== 'string' || !habit.name.trim() || !validDate(habit.startDate)) return false;
      seen.add(habit.id);
      return true;
    }).map(habit => ({id: habit.id, name: habit.name.trim().slice(0, 60), startDate: habit.startDate}));
  }
  function checks(input, habits) {
    const clean = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return clean;
    for (const habit of habits) if (input[habit.id] === true) clean[habit.id] = true;
    return clean;
  }
  const active = (habits, date) => habits.filter(habit => habit.startDate <= date);
  let options;
  function init(config) {
    options = config;
    const form = document.getElementById('habit-form');
    const input = document.getElementById('habit-name');
    const toggle = document.getElementById('habit-add');
    const closeForm = () => {
      form.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      input.value = '';
      input.setCustomValidity('');
      toggle.focus();
    };
    toggle.onclick = () => {
      form.hidden = !form.hidden;
      toggle.setAttribute('aria-expanded', String(!form.hidden));
      if (!form.hidden) input.focus();
    };
    document.getElementById('habit-cancel').onclick = closeForm;
    input.oninput = () => input.setCustomValidity('');
    form.onsubmit = event => {
      event.preventDefault();
      const name = input.value.trim().replace(/\s+/g, ' ');
      const state = options.getState();
      if (!name || state.habits.some(habit => habit.name.toLocaleLowerCase('nl') === name.toLocaleLowerCase('nl'))) {
        input.setCustomValidity(name ? 'Deze gewoonte bestaat al.' : 'Vul een naam in.');
        input.reportValidity();
        return;
      }
      const id = 'h-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
      const habit = {id, name, startDate: options.getDate()};
      state.habits.push(habit);
      try { options.save(); }
      catch (_) {
        state.habits.pop();
        options.notify('Opslaan lukt niet. Maak ruimte vrij en probeer opnieuw.');
        return;
      }
      closeForm();
      options.onChange();
      document.querySelector(`[data-habit="${id}"]`).focus();
      options.notify('Gewoonte toegevoegd ✓');
    };
    document.getElementById('habit-list').addEventListener('change', event => {
      const id = event.target.dataset.habit;
      const state = options.getState(), date = options.getDate();
      if (!id || !active(state.habits, date).some(habit => habit.id === id)) return;
      const previous = state.entries[date];
      const entry = options.getEntry(date);
      const done = {...entry.habits};
      if (event.target.checked) done[id] = true; else delete done[id];
      state.entries[date] = {...entry, habits: done};
      try { options.save(); }
      catch (_) {
        if (previous) state.entries[date] = previous; else delete state.entries[date];
        render();
        options.notify('Opslaan lukt niet. Maak ruimte vrij en probeer opnieuw.');
        return;
      }
      options.onChange();
      document.querySelector(`[data-habit="${id}"]`).focus({preventScroll: true});
      options.notify();
    });
  }
  function render() {
    const state = options.getState(), date = options.getDate();
    const habits = active(state.habits, date), entry = options.getEntry(date);
    const list = document.getElementById('habit-list');
    list.replaceChildren();
    document.getElementById('habit-empty').hidden = habits.length > 0;
    document.getElementById('habit-start-note').textContent = date === options.getToday()
      ? 'Je nieuwe gewoonte begint vandaag.' : 'Je nieuwe gewoonte begint op de geselecteerde dag.';
    for (const habit of habits) {
      const label = document.createElement('label');
      label.className = 'habit-row';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.habit = habit.id;
      input.checked = entry.habits?.[habit.id] === true;
      const name = document.createElement('span');
      name.textContent = habit.name;
      const status = document.createElement('small');
      status.textContent = input.checked ? 'Gedaan' : 'Nog doen';
      label.append(input, name, status);
      list.append(label);
    }
  }
  function renderOverview(dates) {
    const state = options.getState(), mount = document.getElementById('habit-overview');
    mount.replaceChildren();
    const habits = state.habits.filter(habit => dates.some(date => date >= habit.startDate));
    if (!habits.length) {
      const empty = document.createElement('p');
      empty.className = 'backup-txt';
      empty.textContent = 'Voeg bij Vandaag je eigen gewoontes toe. Hier zie je hoe vaak je ze afvinkt.';
      mount.append(empty);
    }
    for (const habit of habits) {
      const eligible = dates.filter(date => date >= habit.startDate);
      const completed = eligible.filter(date => options.getEntry(date).habits?.[habit.id] === true).length;
      const row = document.createElement('div');
      row.className = 'habit-summary';
      const name = document.createElement('strong');
      name.textContent = habit.name;
      const result = document.createElement('span');
      result.textContent = `${completed} / ${eligible.length} dagen`;
      const meter = document.createElement('progress');
      meter.max = eligible.length;
      meter.value = completed;
      meter.setAttribute('aria-label', habit.name);
      row.append(name, result, meter);
      mount.append(row);
    }
  }
  return {validDate, definitions, checks, active, init, render, renderOverview};
})();
