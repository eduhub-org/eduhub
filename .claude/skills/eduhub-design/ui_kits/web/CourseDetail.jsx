// EduHub UI Kit — Course detail page

function Registration({ course, enrolled, onRegister }) {
  return (
    <div className="eh-reg eh-card-dark">
      <h3>{enrolled ? 'You\'re enrolled' : 'Application'}</h3>
      <div className="price">{course.price === 0 ? 'Free' : course.price + ' €'} <small>· {course.level}</small></div>
      <ul>
        <li><img src="../../assets/icon-checkmark.svg" alt="" />Certificate on completion</li>
        <li><img src="../../assets/icon-checkmark.svg" alt="" />Mentor support &amp; community</li>
        <li><img src="../../assets/icon-checkmark.svg" alt="" />Project-based learning</li>
      </ul>
      {enrolled ? (
        <Button variant="filled" disabled style={{ width: '100%', justifyContent: 'center' }}>Application sent ✓</Button>
      ) : (
        <Button variant="brand" style={{ width: '100%', justifyContent: 'center' }} onClick={onRegister}>Apply now</Button>
      )}
      <p style={{ fontSize: 12, opacity: .55, margin: '12px 0 0', textAlign: 'center' }}>
        {course.badge ? 'Extended application period' : 'Applications close soon'}
      </p>
    </div>
  );
}

function InfoPanel({ course }) {
  return (
    <div className="eh-card-dark eh-info">
      <div className="r"><span className="k">Language</span><span>{course.lang}</span></div>
      <div className="r"><span className="k">Schedule</span><span>{course.day}</span></div>
      <div className="r"><span className="k">Location</span><span>{course.loc}</span></div>
      <div className="r"><span className="k">Level</span><span>{course.level}</span></div>
      <div className="r" style={{ borderBottom: 'none' }}><span className="k">Certificate</span><span>Yes</span></div>
    </div>
  );
}

function CourseDetail({ course, enrolled, onBack, onRegister }) {
  const sessions = [
    { t: 'Kickoff & community intro', d: course.day },
    { t: 'Foundations workshop', d: 'Hands-on, with mentors' },
    { t: 'Project sprint', d: 'Build in small teams' },
    { t: 'Demo day', d: 'Present to the community' }
  ];
  return (
    <React.Fragment>
      <div className="eh-detail__hero" style={{ backgroundImage: `linear-gradient(51deg, rgba(0,0,0,.7) 17%, rgba(0,0,0,0) 85%), url('${window.EH_DATA.cover}')`, backgroundPosition: course.pos || 'center' }}>
        <div className="container">{course.title}</div>
      </div>
      <div className="container">
        <div style={{ paddingTop: 20 }}>
          <button className="eh-btn eh-btn--sm" onClick={onBack}>← All courses</button>
        </div>
        <div className="eh-detail__top">
          <div className="lead">
            <div className="day">{course.day}</div>
            <div className="tag">{course.tagline}</div>
          </div>
          <Registration course={course} enrolled={enrolled} onRegister={onRegister} />
        </div>
        <div className="eh-twocol">
          <div className="main">
            <h2 className="eh-h2">What you'll learn</h2>
            <ul className="eh-goals">
              {course.goals.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
            <h2 className="eh-h2" style={{ marginTop: 48 }}>Sessions</h2>
            {sessions.map((s, i) => (
              <div className="eh-session" key={i}>
                <div className="num">{i + 1}</div>
                <div><div className="st">{s.t}</div><div className="sd">{s.d}</div></div>
              </div>
            ))}
          </div>
          <div className="side">
            <h2 className="eh-h2">Details</h2>
            <InfoPanel course={course} />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { Registration, InfoPanel, CourseDetail });
