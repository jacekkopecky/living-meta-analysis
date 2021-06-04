import React, { useContext, useState } from 'react';
import EditContext from '../EditContext';
import Popup from '../Popup';

function FilterModeratorsPopup(props) {
  const { flag, mwgState } = props;
  const [moderatorsWithGroups, setModeratorsWithGroups] = mwgState;
  const [popupStatus, setPopupStatus] = flag;
  const groupFilterFlag = {};

  for (let i = 0; i < moderatorsWithGroups.length; i += 1) {
    groupFilterFlag[moderatorsWithGroups[i].moderatorObj.title] = false;
  }

  const [groupFlagState, setGroupFlagState] = useState(groupFilterFlag);

  function toggleGroupFlagState(id) {
    const flagStateClone = { ...groupFlagState };
    flagStateClone[id] = !flagStateClone[id];
    setGroupFlagState(flagStateClone);
  }

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
  };

  function handleSubmit(e) {
    e.preventDefault();
    closeHandler();
  }

  function handleModToggle(e) {
    const modTitle = e.currentTarget.value;
    const mwgClone = [...moderatorsWithGroups];
    for (let i = 0; i < mwgClone.length; i += 1) {
      if (mwgClone[i].moderatorObj.title === modTitle) {
        mwgClone[i].included = !mwgClone[i].included;
      }
    }
    setModeratorsWithGroups(mwgClone);
  }

  function handleGroupToggle(e) {
    const [modTitle, groupTitle] = e.currentTarget.value.split('+');
    const mwgClone = [...moderatorsWithGroups];
    for (let i = 0; i < mwgClone.length; i += 1) {
      if (mwgClone[i].moderatorObj.title === modTitle) {
        for (let j = 0; j < mwgClone[i].groups.length; j += 1) {
          if (mwgClone[i].groups[j].group === groupTitle) {
            mwgClone[i].groups[j].included = !mwgClone[i].groups[j].included;
          }
        }
      }
    }
    setModeratorsWithGroups(mwgClone);
  }

  const content = (
    <>
      <h1>Select which moderators are to be displayed</h1>
      <form onSubmit={handleSubmit} id="modFilterForm">
        { moderatorsWithGroups.map((mod) => (
          <>
            <div>
              <label htmlFor={`modFilter${mod.moderatorObj.title}`} key={`modFilter${mod.moderatorObj.title}`}>{ mod.moderatorObj.title }
                <input
                  type="checkbox"
                  value={mod.moderatorObj.title}
                  name={`modFilter${mod.moderatorObj.title}`}
                  checked={!!mod.included}
                  onChange={handleModToggle}
                />
              </label>
              <div
                role="button"
                tabIndex={0}
                key={`modFilter${mod.moderatorObj.title}GroupButton`}
                onClick={() => toggleGroupFlagState(mod.moderatorObj.title)}
                onKeyPress={() => toggleGroupFlagState(mod.moderatorObj.title)}
                className="groupToggleButton"
              >
                { groupFlagState[mod.moderatorObj.title] ? 'Hide groups' : 'Show groups' }
              </div>
              { groupFlagState[mod.moderatorObj.title]
                ? mod.groups.map((group) => (
                  <label className="indent" htmlFor={`${mod.moderatorObj.title}${group.group}`} key={`${mod.moderatorObj.title}${group.group}`}>{ group.group }:
                    <input
                      type="checkbox"
                      value={`${mod.moderatorObj.title}+${group.group}`}
                      name={`${mod.moderatorObj.title}${group.group}`}
                      checked={!!group.included}
                      onChange={handleGroupToggle}
                    />
                  </label>
                ))
                : null }
            </div>
          </>
        )) }
        <input type="submit" className="submitButton" value="Done" />
      </form>
    </>
  );

  if (popupStatus) {
    return <Popup content={content} closingFunc={closeHandler} />;
  } else {
    return null;
  }
}

function FilterModerators(props) {
  const { mwgState } = props;
  const edit = useContext(EditContext);
  const [popupStatus, setPopupStatus] = useState(false);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  if (edit.flag) {
    return (
      <>
        <div role="button" tabIndex={0} type="submit" id="filterModeratorsButton" onClick={popupToggle} onKeyDown={popupToggle}>
          Filter moderators
        </div>
        <FilterModeratorsPopup flag={[popupStatus, setPopupStatus]} mwgState={mwgState} />
      </>
    );
  } else {
    return null;
  }
}

export default FilterModerators;
