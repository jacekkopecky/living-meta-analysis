(function (window, document) { // eslint-disable-line no-unused-vars

  function init() {
    // set up click listeners for selecting tabs
    const tabs = document.querySelectorAll('#tabbar .tablinks');
    for (const tabBtn of tabs) {
      tabBtn.addEventListener('click', openTab);
    }

    // show active tab (or just the first one)
    const activeTab = findActiveTabId();
    showTab(activeTab);
  }

  window.lima.initTabs = init;

  function openTab(e) {
    window.scroll(0,0);
    showTab(e.target.dataset.tab);
  }

  function showTab(tabName) {
    // hide contents of all tabs, just show current tab
    const tabContents = document.querySelectorAll(".tabcontent");
    for (const tabContent of tabContents) {
      tabContent.style.display = tabContent.id === tabName ? "" : "none";
    }

    // make selected tab active, all other tabs inactive
    const tabLinks = document.querySelectorAll(".tablinks");
    for (const link of tabLinks) {
      link.classList.toggle('active', link.dataset.tab === tabName);
    }

    // save the active tab name so if we're rebuilding the page, we can select the same tab
    document.body.dataset.activeTab = tabName;
  }

  function findActiveTabId() {
    // check if body has data-active-tab, try to find a matching tab
    const bodyTab = document.body.dataset.activeTab;
    if (bodyTab) {
      for (const btn of document.querySelectorAll("#tabbar .tablinks")) {
        if (btn.dataset.tab === bodyTab) return bodyTab;
      }
    }

    // try to find a tab marked as active
    const activeTab = document.querySelector('#tabbar .tablinks.active');
    if (activeTab) return activeTab.dataset.tab;

    // if the above failed, just return the first tab
    return document.querySelector('#tabbar .tablinks').dataset.tab;
  }

})(window, document);
