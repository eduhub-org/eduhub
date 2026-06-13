// EduHub UI Kit — Landing page (Hero + course rows)

function CourseTile({ course, onOpen }) {
  return (
    <div className="eh-tile" onClick={() => onOpen(course)}>
      <div className="eh-tile__cover" style={{ backgroundImage: `url('${window.EH_DATA.cover}')`, backgroundPosition: course.pos || 'center' }}>
        {course.badge && <span className="eh-tile__badge">{course.badge}</span>}
        <div className="eh-tile__title">{course.title}</div>
      </div>
      <div className="eh-tile__body light">
        <div className="eh-tile__meta">
          <span>{course.day}</span>
          <span className="lang"><img src="../../assets/icon-language.svg" alt="" />{course.lang}</span>
        </div>
        <div className="eh-tile__tagline">{course.tagline}</div>
        <div className="eh-tile__loc"><img src="../../assets/icon-pin.svg" alt="" />{course.loc}</div>
      </div>
    </div>
  );
}

function CourseRow({ group, onOpen }) {
  return (
    <div className="eh-row">
      <h2 className="eh-row__title">{group.title}</h2>
      <div className="eh-row__scroll">
        {group.courses.map(c => <CourseTile key={c.id} course={c} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

function Landing({ onOpen }) {
  return (
    <React.Fragment>
      <div className="eh-hero">
        <div className="container eh-hero__h">
          <h1>Start Hacking<br />Your Life</h1>
        </div>
      </div>
      <div className="container eh-rows">
        {window.EH_DATA.groups.map((g, i) => <CourseRow key={i} group={g} onOpen={onOpen} />)}
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { CourseTile, CourseRow, Landing });
